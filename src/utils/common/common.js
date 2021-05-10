
export const isJsonString=(str)=>{
    try{
        if(typeof JSON.parse(str)==='object'){
            return true
        }
    }catch (e) {

    }
    return false

}
//判断是否是空对象
export function isEmptyObject(value){
    try{
        if(typeof JSON.parse(value)==='object'){
            //判断是否为空
            return Object.keys(value).length===0
        }
    }catch (e) {
    }
    return false
}


export  default [
    isJsonString,
    isEmptyObject
]

/*
 *判断是否是数字
 *
 */

export function isRealNum(val){
    // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除，

    if(val === "" || val ==null){
        return false;
    }
    if(!isNaN(val)){
        //对于空数组和只有一个数值成员的数组或全是数字组成的字符串，isNaN返回false，例如：‘123‘、[]、[2]、[‘123‘],isNaN返回false,
        //所以如果不需要val包含这些特殊情况，则这个判断改写为if(!isNaN(val) && typeof val === ‘number‘ )
        return true;
    }
    else{
        return false;
    }

}


//数组去重
export function unique (arr) {
    return Array.from(new Set(arr))
}



//获取16位16进制字符串
export function getRamNumber(){
    let result='';
    for(let i=0;i<16;i++){

        result+=Math.floor(Math.random()*16).toString(16);//获取0-15并通过toString转16进制
    }

//默认字母小写，手动转大写
    return result.toLocaleUpperCase();//另toLowerCase()转小写
}

export function base64Encode(data) {
    let encodeData=window.btoa(data)
    return (encodeData)

}
export function base64Decode(data) {
    let decodeData=window.atob(data)
    return (decodeData)

}
//数字每三位逗号分隔
export function thousands(num){
    let str = num.toString();
    let reg = str.indexOf(".") > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
    return str.replace(reg,"$1,");
}


