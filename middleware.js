import {NextResponse} from 'next/dist/server/web/spec-extension/response'

export default function middleware(req) {
    let user_verify = req.cookies.get('user');
    let teacher_verify = req.cookies.get('teacher');
    let admin_verify = req.cookies.get('admin');
    let url = req.url

    console.log('runningggg')

    if(!user_verify && teacher_verify && admin_verify){
        
    }

    return  NextResponse.next()

}
