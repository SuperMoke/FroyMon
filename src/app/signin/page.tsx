'use client';
import { Alert } from '@material-tailwind/react';
import Button from '@material-tailwind/react/components/Button';
import { Input } from '@material-tailwind/react/components/Input';
import { signIn } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useState } from 'react';
import Loading from '../component/Loading';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const router = useRouter();
  
  const handleSignIn = async () => {
    setLoading(true); 
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    });
    if (result?.error) {
      setError('Sorry, Wrong Email or Password!');
      setLoading(false); 
    } else {
      if(email.includes('teacher')){
        router.push('/teacher')
      } else if(email.includes('admin')){
        router.push('/admin')
      } else{
        router.push('/user')
      }
    }
  };

  
  return (
    <>
    {loading ? ( 
        <Loading />
      ) : (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-22 w-auto"
            src="./froymon_logo.png"
            alt="FroyMon"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black">
           Welcome Back!
          </h2>
          <h2 className="text-center text-2xl leading-9 tracking-tight text-black">
           Sign in to your account!
          </h2>
          {error && (
        <Alert className='mt-10 p-2 text-sm ' variant='outlined' color='red'>
          {error}
        </Alert>
      )}
        </div>
        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-black">
                Email address
              </label>
              <div className="mt-2">
                <Input 
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                label='Enter Your Email' 
                crossOrigin={undefined}
                onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-black">
                  Password
                </label>
                <div className="text-sm font-medium">
                  <div onClick={() => router.push('/forgot-password')} className="cursor-pointer font-semibold text-gray-600 hover:text-indigo-300">
                    Forgot password?
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <Input
                   id="password"
                   name="password"
                   type="password"
                   autoComplete="password"
                   required
                   label='Enter Your password' 
                   crossOrigin={undefined}
                   onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
            
            </div>
          </div>

            <Button 
            className='flex w-full justify-center'
            type='submit'
            variant='filled'
            onClick={handleSignIn}
            placeholder={undefined}             >
              Sign In
            </Button>
        </div>
      </div>
      )}
    </>
  );
}