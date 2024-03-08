'use client'
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'loading') return; 

    if (!session) {
      router.push('/signin'); 
    } else {
      router.push('/user'); 
    }
  }, [session, status]);


  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
<<<<<<< HEAD
    <div>
      <h2>Hello World!!!</h2>
    </div>
  );
=======
    <>
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black">
           QR Code Reader
          </h2>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Html5QrcodePlugin
            fps={10} 
            qrbox={250}
            aspectRatio={1}
            disableFlip={true}
            verbose={false}
            qrCodeSuccessCallback={handleRead}
            qrCodeErrorCallback={(errorMessage: string) => console.error(errorMessage)}
          />
          <div className='text-black text-center'>Account Email: {session?.data?.user?.email}</div>
          <div className='text-black text-center'>Value of the QR: {val}</div>
        </div>       
        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
            <Button 
            className='flex w-full justify-center'
            placeholder={undefined} 
            onClick={() => signOut()}            >
              Logout
            </Button>
        </div>
      </div>
    </>
  )
>>>>>>> 16e4fcc96dc4eee8cdf1d82305ed4c7a33cf35be
}
