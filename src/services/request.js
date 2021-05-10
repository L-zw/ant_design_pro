import {axiosPro} from "./axios/axios";
import router from 'umi/router'
import {getNonceStr, resetNonceStr} from "../utils/encrypt/requestEncrypt/nonceStr";
import {aesDecrypt, aesEncrypt} from "../utils/encrypt/cryptoAes";
import { getRsaEncryptKey, resetEncryptKey} from '../utils/encrypt/requestEncrypt/reqRsa'
import {isEncryptReq} from '../../config/custom.config'
import {requestUrl} from '../utils/env/defaultSetting'

const method = 'post'
const url = requestUrl

window.setInterval(function(){
    //定时更新nonceStr
    resetNonceStr()
    //定时更新rsaEncryptKey
    let nonceStr=getNonceStr()
    resetEncryptKey(nonceStr)
}, 3600000);

export async function request (params) {
    const data = JSON.stringify(params)
    //加密
    let resp={}
    if(isEncryptReq){
        resp= await encryptRequest(data)
    }else {
        resp=await rawRequest(data)
    }
    let dataResp={data:resp}
    checkTokenExpire(dataResp)
    return dataResp
}

//加密请求
async function encryptRequest(data){
    let nonceStr=getNonceStr()
    const sEncryptKey=getRsaEncryptKey()
    const sEncryptBody=aesEncrypt(data,nonceStr,nonceStr)
    let opt={
        method: method,
        url: url,
        // data: data,
        data:sEncryptBody,
        headers: {
            'Body-Encrypt-Key': sEncryptKey,
        }
    }
    const resp = await axiosPro(opt)
    let newResp=aesDecrypt(resp.data,nonceStr,nonceStr)
    return JSON.parse(newResp)

}

async function rawRequest(data){
    let opt={
        method: method,
        url: url,
        data: data,
        transformResponse:[function(data){
            return JSON.parse(data)
            // return data
        }]
    }
    const dataResp = await axiosPro(opt)
    return dataResp.data
}


async function checkTokenExpire(response) {
    try{
        const resp=response.data
        if(resp.hasOwnProperty("resp_code")&&resp.resp_code===0){
            const respBody=resp.resp_body
            //检查token是否过期
            if(respBody.eRetCode===401){
                // notification.error({
                //     message: '未登录或登录已过期，请重新登录。',
                // });
                // window.g_app._store.dispatch({
                //     type: 'login/logout',
                // });
                router.push("/user/login")
                return;
            }
        }

    }catch (e) {
        console.log("e",e)
    }


}
