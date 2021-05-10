import axios from 'axios'

export  function axiosPro(opt) {
    return new Promise(function (resolve, reject) {
        axios(opt).then(function (ret) {
            resolve(ret)
        }).catch(function (err) {
            reject(err)
        })
    })
}
