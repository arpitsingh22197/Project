import { useState, useCallback, useRef } from "react";

interface AISuggestionsState {
    suggestion: string | null;
    isLoading: boolean;
    position: { line: number; column: number } | null;
    decoration: string[];
    isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
    toggleEnabled: () => void;
    fetchSuggestion: (type: string, editor: any) => Promise<void>;
    acceptSuggestion: (editor: any, monaco: any) => void;
    rejectSuggestion: (editor: any) => void;
    clearSuggestion: (editor: any) => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
    const [state, setState] = useState<AISuggestionsState>({
        suggestion: null,
        isLoading: false,
        position: null,
        decoration: [],
        isEnabled: true,
    });


const abortController = useRef<AbortController | null>(null);
const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const toggleEnabled = useCallback(() => {
        setState((prev) => {
            const nextEnabled = !prev.isEnabled;

            if (!nextEnabled) {
                // Turning AI off should stop everything *now*, not just block
                // future triggers. Previously this only flipped the flag, so
                // an already-in-flight request would still land and display
                // a suggestion, and anything already showing on screen just
                // stayed there until something else cleared it.
                if (debounceTimer.current) {
                    clearTimeout(debounceTimer.current);
                    debounceTimer.current = null;
                }
                if (abortController.current) {
                    abortController.current.abort();
                    abortController.current = null;
                }
            }

            return {
                ...prev,
                isEnabled: nextEnabled,
                ...(nextEnabled
                    ? {}
                    : { suggestion: null, position: null, decoration: [], isLoading: false }),
            };
        });
    }, [])

const fetchSuggestion = useCallback(
  async (type: string, editor: any) => {
    if (!state.isEnabled || !editor) return;

    const model = editor.getModel();
    const cursorPosition = editor.getPosition();

    if (!model || !cursorPosition) return;

    // Cancel previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    debounceTimer.current = setTimeout(async () => {
      abortController.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
      }));

      try {
        const payload = {
          fileContent: model.getValue(),
          cursorLine: cursorPosition.lineNumber - 1,
          cursorColumn: cursorPosition.column - 1,
          suggestionType: type,
        };

        const response = await fetch("/api/code-completion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();

        if (data.suggestion) {
          setState((prev) => {
            // Re-check against the latest state, not the value captured
            // when this request started — closes the narrow race window
            // between toggling off and the abort actually taking effect.
            if (!prev.isEnabled) return prev;
            return {
              ...prev,
              suggestion: data.suggestion.trim(),
              position: {
                line: cursorPosition.lineNumber,
                column: cursorPosition.column,
              },
              isLoading: false,
            };
          });
        } else {
          setState((prev) => ({
            ...prev,
            suggestion: null,
            isLoading: false,
          }));
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error fetching suggestion:", error);
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    }, 400);
  },
  [state.isEnabled]
);


// FIXED: This callback no longer touches the editor at all.
//
// Bug before the fix (two bugs, same root cause):
//   1. By the time PlaygroundEditor calls onAcceptSuggestion(editor, monaco),
//      it has ALREADY run editor.executeEdits(...) itself to insert the
//      suggestion text and reposition the cursor. This callback was running
//      executeEdits AGAIN, using this hook's own (stale) `position`/`suggestion`
//      state — which duplicated the inserted text at the wrong location.
//   2. That second executeEdits call synchronously fires Monaco's onChange,
//      which bubbles up through onContentChange -> updateFileContent ->
//      the zustand store's set(). Because that whole chain was happening
//      *inside* this hook's setState updater function, React treated it as
//      a state update on a different component while still processing this
//      one's render — producing "Cannot update a component while rendering
//      a different component."
//
// Fix: this callback's only job is to reset its own state. The actual
// text insertion/cursor placement/decoration cleanup is already handled
// by PlaygroundEditor's acceptCurrentSuggestion before this is ever called.
const acceptSuggestion = useCallback(
  (_editor: any, _monaco: any) => {
    setState((currentState) => ({
      ...currentState,
      suggestion: null,
      position: null,
      decoration: [],
      isLoading: false,
    }));
  },
  []
);

    const rejectSuggestion = useCallback((editor:any)=>{
            setState((currentState)=>{
                 if(editor && currentState.decoration.length > 0){
                    editor.deltaDecorations(currentState.decoration , [])
                }

                return {
                    ...currentState,
                    suggestion:null,
                    position:null,
                    decoration:[]
                }
            })
    },[]);
 
    const clearSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);


  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion
  }

}