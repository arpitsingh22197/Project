import { deleteProjectById, duplicateProjectById, editProjectById, getAllPlaygroundForUser } from '@/modules/dashboard/actions'
import AddNewButton from '@/modules/dashboard/components/add-new'
import AddRepo from '@/modules/dashboard/components/add-repo'
import ProjectTable from '@/modules/dashboard/components/project-rable'
import EmptyState from '@/modules/dashboard/empty-state'
import React from 'react'

const Page = async() => {
  const playgrounds = await getAllPlaygroundForUser();
  const projects = (playgrounds || []).map((p) => ({
    ...p,
    description: p.description || "",
    user: {
      ...p.user,
      name: p.user.name || "Anonymous",
      image: p.user.image || "",
    },
  }));

  return (
    <div className="flex flex-col min-h-screen mx-auto max-w-7xl px-4 py-10"> 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <AddNewButton />
        <AddRepo />
      </div>
      
      <div className='mt-10 w-full flex-grow'> 
        {
          playgrounds && playgrounds.length === 0 ? (
            <div className='w-full h-full flex items-center justify-center'>
              <EmptyState />
            </div>
          ) : (
            <ProjectTable
              projects={projects}
              onDeleteProject={deleteProjectById}
              onUpdateProject={editProjectById}
              onDuplicateProject={duplicateProjectById}
            />
          )
        }
      </div>
    </div>
  )
}

export default Page