import { Empty } from '@/components/ui/empty'
import { getAllPlaygroundForUser } from '@/modules/dashboard/actions'
import AddNewButton from '@/modules/dashboard/components/add-new'
import AddRepo from '@/modules/dashboard/components/add-repo'
import ProjectTable from '@/modules/dashboard/components/project-rable'
import EmptyState from '@/modules/dashboard/empty-state'
import { get } from 'http'
import React from 'react'

const Page = async() => {
  const playgrounds = await getAllPlaygroundForUser();
  return (
    // Changed justify-start to flex-col (already there) and added h-full
    <div className="flex flex-col min-h-screen mx-auto max-w-7xl px-4 py-10"> 
      {/* Container for AddNewButton and AddRepo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <AddNewButton />
        <AddRepo />
      </div>
      
      {/* THIS IS THE CRITICAL CHANGE */}
      {/* 1. Added flex-grow to make this div take up all remaining space.
        2. Removed justify-center/items-center from here, as EmptyState will handle it.
      */}
      <div className='mt-10 w-full flex-grow'> 
        {
          playgrounds && playgrounds.length === 0 ? (
            // The EmptyState must be wrapped in a container that is full height
            // to fill the flex-grow parent and push the content to the center.
            <div className='w-full h-full flex items-center justify-center'>
                <EmptyState />
            </div>
          ) : (
            <ProjectTable
              projects={playgrounds || []}
              onDeleteProject={()=>{}}
              onUpdateProject={()=>{}}
              onDuplicateProject={()=>{}}
            />
          )
        }
      </div>
    </div>
  )
}

export default Page