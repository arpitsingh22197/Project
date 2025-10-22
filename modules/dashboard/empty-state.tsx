import React from 'react';

const EmptyState = () => {
  return (
    
    <div className="flex items-center justify-center flex-col w-full h-full"> 
      
      <img src="/empty-state.svg" alt="No projects" className="w-56 h-56 mb-6" /> 
      <h2 className="text-2xl font-bold text-gray-200 mb-2">No projects found</h2>
      <p className="text-gray-400 text-lg">Create a new project to get started!</p>
    </div>
  );
};

export default EmptyState;