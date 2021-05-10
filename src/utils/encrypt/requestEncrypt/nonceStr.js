var nonceStr=''

export function resetNonceStr() {

    let newStr=getRamNumber()
    nonceStr=newStr
}

export function getNonceStr() {
    if (nonceStr.length===0){
        resetNonceStr()
    }
    return nonceStr
}

//获取16位16进制字符串
function getRamNumber(){
    let result='';
    for(let i=0;i<16;i++){

        result+=Math.floor(Math.random()*16).toString(16);//获取0-15并通过toString转16进制
    }

//默认字母小写，手动转大写
    return result.toLocaleUpperCase();//另toLowerCase()转小写
}