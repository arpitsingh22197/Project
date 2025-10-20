import React from 'react'
import Image from 'next/image'
import SignInFormClient from '@/modules/auth/components/sing-in-form-client'
const Page = () => {
  return (
    <>
        <Image src={"/login.svg"} alt="login image" width={300} height={300} className='m-6 object-cover' />
        <SignInFormClient  />
    </>
  )
}

export default Page
