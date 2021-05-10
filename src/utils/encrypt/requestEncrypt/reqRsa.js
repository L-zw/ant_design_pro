import {JSEncrypt} from 'jsencrypt'
// const CryptoJS = require('crypto-js');

import {getNonceStr} from './nonceStr'

//请求体加密公钥
const publicKey=`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8/Rig/XhO9lqB0WovvKYk3bR9
bSD4Rzz6Fhgf6wRQ+75B4Sbhu5AJz1Jbljbtf1r/DcJBH32JC6hmbmTK0nxWL3au
K5n3Gx+bV8EZVtcYKnzfrei6ZFFmVck9xAkbbTKqwGLMsC3mRqXGQhCGw+dPKsRH
hBXHO9ZzcMhMX3e09QIDAQAB
-----END PUBLIC KEY-----`

//公共rsaKey,定时变换

let rsaEncryptKey=""

export function rsaEncrypt(str){
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    return encrypt.encrypt(str);
}

export function rsaDecrypt(msg,key){
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(key);
    const decryptMsg = decrypt.decrypt(msg);
    return decryptMsg;
}

export function resetEncryptKey(str) {
    let encryptKey=rsaEncrypt(str)
    rsaEncryptKey=encryptKey
}

export function getRsaEncryptKey() {
    if(rsaEncryptKey.length===0){
        let nonceStr=getNonceStr()
        resetEncryptKey(nonceStr)
    }
    return rsaEncryptKey
}


