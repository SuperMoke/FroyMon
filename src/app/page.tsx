'use client';
import Button from '@material-tailwind/react/components/Button';
import Input from '@material-tailwind/react/components/Input';
import { signOut, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import router from 'next/router';
import React from 'react';
import QrCodeReader, {QRCode} from 'react-qrcode-reader';


export default function Home() {
  const session = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/signin');
    },
  });

  const [val, setVal] =  React.useState<string>('');
  const handleRead = (code: QRCode) =>{
    setVal(code.data);
  }
  return (
    <>
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black">
           QR Code Reader
          </h2>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <QrCodeReader delay={100} width={500} height={500} onRead={handleRead} />
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
}


Home.requireAuth = true