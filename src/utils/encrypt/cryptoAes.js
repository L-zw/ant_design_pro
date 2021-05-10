const CryptoJS = require('crypto-js');

// const key = CryptoJS.enc.Utf8.parse("1234123412ABCDEF");  //十六位十六进制数作为密钥
// const iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');   //十六位十六进制数作为密钥偏移量

export function aesDecrypt(word,key,iv) {
    key=CryptoJS.enc.Utf8.parse(key)
    iv=CryptoJS.enc.Utf8.parse(iv)
    let decrypt = CryptoJS.AES.decrypt(word, key, { iv: iv, mode: CryptoJS.mode.CBC,padding: CryptoJS.pad.Pkcs7});
    let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
}

//加密方法
export function aesEncrypt(word,key,iv) {
    key=CryptoJS.enc.Utf8.parse(key)
    iv=CryptoJS.enc.Utf8.parse(iv)
    let srcs = CryptoJS.enc.Utf8.parse(word);
    let encrypted = CryptoJS.AES.encrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC,padding: CryptoJS.pad.Pkcs7});
    // let encrypted = CryptoJS.AES.encrypt(srcs, key, { iv: iv });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
}
