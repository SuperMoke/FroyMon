import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "froymon-2b381",
      clientEmail: "firebase-adminsdk-l6oez@froymon-2b381.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDS0RMO+8D0hYVo\nBKp63+k4UqMg2+adDEO2yLln9pqLIj4ZYx9JOr7k3mAtZwTr2E3etU4TiZv3vY4E\n5ln30meaC+RT7lI5u7iP3vN9RKlonPoqcNsA62SQFyufEjR/KSb0XrgBxs36d5CH\nxh0L5nkf/ZdYelwAHLZJMOUcjuYtkgNgmmgvKaY1A1ZIO7pnQbulTwg6tKaKMm8b\n59VK/4KX6XXHN3FBB5Y1r8UtAAZqDNBIAKRKYFHpG0JBa+aoqX+1E6898BTrrcQi\n19E2o3MmAx5Rolj2Zc2/w1p/N6u/BcIN6aeyzym6fXGvQG+0aW7P8QMdzqN3MQpF\nwp7+Npa1AgMBAAECggEAIeN4A9WWa/g2vMTbPstVqzclf/e5d49sJyrXGw46Q5lq\nkBwuAFCQNSxGG6ZO1Ta9NcrBVUSurMFs3f7FgZ/yBYJZ3uAVmbBCd+YoEAAEl4t8\nb2wa2Gf+j2caHQUJKVPNLkU3oRl7LQMhWaIQM0SGPg0+0ftBZMc4ykUw30ldWP+w\nGOLaQip7hHtsBKsVYKD1tb1gH0cd+O+nNw10euFZ9+z76g28juFefwSuhM8ZpSM7\nHw9K0mfpcJK5xa6NqRxX5dW0xk8cRV5/JdkieaDf8X2eMlHwfEjYgJjYfb9BOiuR\nmO+H4uekKXwFJsgN+nMQC6OMLjooJNicRlPi8AuXNQKBgQDoiBAop7JQJuCHxsq0\nTE54+JujBG5qG0sksYqRGtKcF5u5dkYwVJ+EcB/bzimeEmqAYnu+YQIVCtN6Y0Sj\n01GgBRHcB8i0y7Zf4hRTHFEn5nVDFhP/TtYH+e0o6Q0ePD3qt2HbqGtKBxzB0eZO\ngCdYsKYMp6nuEJPN+wqDbWmojwKBgQDoF/bRHBdJQAA9bsbTbC1BlqJjhPnhKUsQ\nB6RCBHCH5Q1q4tkJNoXsxxzve2xsqXR54Tt3bVLFndtxcn8lSvR2ZDmmynWPAxqK\nhFv3iRJ35xaybz0exTMSyvrV/FRTNHeC2+8f8A96fQOmu5Hz2SHgf97nvb9Fhhav\nCaoOTKzGewKBgBrv6C9NffKbDlesR78rN8v7wMvZr5DLKKFPj+XPXaaHdZq+gNMI\nepI1CvvDnj6Zk4zb28nqIvudDXKYHVN9H2+SJsd+f1myX6Yr4n7eQOiGYf8rh5WD\n5Hd4FGkw1jwyblnKdKOllwg0Wrh5QFzHq8cyb4n3wk+5y+WIt2cSPbMxAoGAZ6kk\nZNsuD1pVgRq0FQPw5qV33AktbgJ6cytmktHWzOth5cZx92pxwIJiCxhOIe5Bhpox\nbDLY0EikFXR1E1v5+dLj6PnuLbTOKuXZCaMgK4t8GLAUVWTwXclo5SAxLYR2iGzg\nzZvz3dpuQg7urkHhnpqeHVUjU9MC2KTxXjeix3cCgYAarT+gRRns8BLV409IRUPE\nWzx17gYCL8jfSA7anQ2Thtbape4hBlPMiekFiTR/Hi3WNaVLuvHkcFOjaTSgLRGo\ncn4N65BcH2v5zfUauUoNmzWD0XqQy6W3iX/0SloHuN/muif29m6b30PIADPZ8axn\nW6HEW5oKeMKAKmosiJP2BQ==\n-----END PRIVATE KEY-----\n",
    }),
  });
}

export async function DELETE(request) {
  try {
    const { uid } = await request.json();
    const auth = getAuth();
    
    await auth.deleteUser(uid);

    const db = getFirestore();
    await db.collection('user').doc(uid).delete();

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

