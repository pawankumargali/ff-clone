import {isAxiosError} from "axios";
import { logoutUser } from "../services/auth.service";

export default function handleError(e: any) {
    console.log(e);
    // console.error(e);
    let errMsg = ""
    if(isAxiosError(e))  {
        errMsg = `HTTPReqFailed: statusCode=${e?.response?.status} error=${JSON.stringify(e?.response?.data) || e?.message}`;
        const errStatus = e.status;
        if(errStatus==401 || errStatus==403) {
            logoutUser();
        }
    }
    else if(e?.message)
        errMsg=e?.message
    else if(e?.stack)
        errMsg=e?.stack?.toString().slice(0,200);
    else 
        errMsg="unknown error";
    throw new Error(errMsg);
}