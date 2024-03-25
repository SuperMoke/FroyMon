'use client'
import Button from '@material-tailwind/react/components/Button';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Html5QrcodePlugin from '../Html5QrcodePlugin'; 
import Input from '@material-tailwind/react/components/Input';
import { Select, Option } from '@material-tailwind/react/components/Select';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import Loading from '../component/Loading';
import { set } from 'firebase/database';

function UserFormPage({ QRval }: { QRval: string }) {
  const [newItem, setnewItem] = useState({
    name: '',
    id: '',
    email: '',
    labid: '',
    compnumber: '',
    compstatus: ''
  });
  
  useEffect(() => {
    setnewItem(prevState => ({
      ...prevState,
      compnumber: QRval.split(' ')[0],
      labid: QRval.split(' ')[1]
    }));
  }, [QRval]);
    
  const handleSelectChange = (value: string | undefined) => {
    if (value) {
      setnewItem({ ...newItem, compstatus: value });
    }
  };

  const addItem = () => {
    addDoc(collection(db,'items'),{
      name: newItem.name,
      id: newItem.id,
      email : newItem.email,
      labid: newItem.labid,
      computernumber : newItem.compnumber,
      computerstatus : newItem.compstatus
    })
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black">
                 Join Lobby Form
                </h2>
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black">
                 QR Content : {QRval}
                </h2>
                <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-black">
                            Student Name:
                            </label>
                            <div className="mt-2">
                                <Input 
                                    value={newItem.name}
                                    onChange={(e)=> setnewItem({...newItem, name: e.target.value})}
                                    id="studentname"
                                    name="studentname"
                                    type="studentname"
                                    autoComplete="name"
                                    required
                                    label='Enter Your name' 
                                    crossOrigin={undefined}
                                    />
                            </div>
                            <label htmlFor="studentid" className="block text-sm font-medium leading-6 text-black mt-2">
                            Student ID:
                            </label>
                            <div className="mt-2">
                                <Input 
                                    value={newItem.id}
                                    onChange={(e)=> setnewItem({...newItem, id: e.target.value})}
                                    id="studentid"
                                    name="studentid"
                                    type="studentid"
                                    required
                                    label='Enter Your Student ID' 
                                    crossOrigin={undefined}
                                    />
                            </div>
                            <label htmlFor="ccaemail" className="block text-sm font-medium leading-6 text-black mt-2">
                            CCA Email:
                            </label>
                            <div className="mt-2">
                                <Input 
                                    value={newItem.email}
                                    onChange={(e)=> setnewItem({...newItem, email: e.target.value})}
                                    id="ccaemail"
                                    name="ccaemail"
                                    type="ccaemail"
                                    required
                                    label='Enter Your CCA Email' 
                                    crossOrigin={undefined}
                                    />
                            </div>
                            <label htmlFor="computerstatus" className="block text-sm font-medium leading-6 text-black mt-2">
                            Computer Status:
                            </label>
                            <div className="mt-2">
                            <Select
                                    label="Select Computer Status"
                                    placeholder={undefined}
                                    value={newItem.compstatus}
                                    onChange={handleSelectChange}
                                >
                                    <Option value="Hardware Issues">Hardware Issues</Option>
                                    <Option value="Software Issues">Software Issues</Option>
                                    <Option value="Network Problems">Network Problems</Option>
                                    <Option value="Computer is Full Functional">Computer is Full Functional</Option>
                                </Select>
                            </div>
                            <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
                                <Button 
                                className='flex w-full justify-center'
                                placeholder={undefined} 
                                onClick={addItem}>
                                SUBMIT
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
}

export default function User() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loggingout, setloggingout] = useState(false);

  React.useEffect(() => {
    if (status === 'loading') return; 
    if (!session) {
      router.push('/signin'); 
    }
  }, [session, status, router]);

  const [QRval, QRsetVal] =  React.useState<string>('');

  const handleRead = (decodedText: string, decodedResult: any) => {
    setLoading(true); 
    setTimeout(() => {
      QRsetVal(decodedText);
      setLoading(false); 
    }, 3000);
  };

  const handleLogout = () => {
    setloggingout(true); 
    setTimeout(() => {
      signOut({callbackUrl: '/'});
    }, 3000);
  };

  if (QRval) {
    return <UserFormPage QRval={QRval} />;
  }
  if (loading) {
    return <Loading />;
  }

  if(loggingout){
    return <Loading/>
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
          <Html5QrcodePlugin
                fps={10}
                qrbox={250}
                disableFlip={false}
                qrCodeSuccessCallback={handleRead}
            />
          <div className='text-black text-center'>Account Email: {session?.user?.email}</div>
          <div className='text-black text-center'>Value of the QR: {QRval}</div>
        </div>  
        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
        </div>     
        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
          <Button 
            className='flex w-full justify-center'
            placeholder={undefined} 
            onClick={handleLogout}            
          >
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}
