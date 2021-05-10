import { routerRedux } from 'dva/router'
import { stringify } from 'qs'
import { request } from '@/services/request'
import { notification } from 'antd';
import { setUserToken, removeUserToken} from '@/utils/authority'
import { getPageQuery } from '@/utils/utils'
import { reloadAuthorized } from '@/utils/Authorized'

import { message } from 'antd'

export default {
    namespace: 'login',

    state: {
        status: undefined,
    },

    effects: {
        *login({ payload }, { call, put }) {
            const response = yield call(request, payload)
            const data=response.data
            if(data.hasOwnProperty("resp_code")&&data.resp_code===0){
                const respBody=data.resp_body
                // Login successfully
                if (respBody.eRetCode === 0) {
                    let Authority =[]
                    try{
                        //获取用户权限
                        payload={
                            "svr_name":"CAD.CadConfSvr",
                            "method_name":"GetCommTypeList",
                            "req_body":{
                                "iUid":respBody.iUid,
                                "eGetType":5
                            }
                        }
                        const resp=yield call(request,payload)
                        const authData=resp.data
                        let authFlag=false
                        if(authData.hasOwnProperty("resp_code")&&authData.resp_code===0){
                            const body=authData.resp_body
                            if(body.eRetCode===0){
                                authFlag=true
                                const authData=body.listTypeNameValue
                                console.log("authData",authData)
                                Authority=authData.map((item)=>{
                                    return item.sKey
                                })
                            }
                        }
                        if(!authFlag){
                            notification.error({
                                message: '用户权限获取失败,请重新登录',
                            });

                        }

                    } catch (e) {
                        notification.error({
                            message: '用户权限获取失败,请重新登录',
                        });

                    }
                    respBody.Authority=Authority
                    yield put({
                        type: 'changeLoginStatus',
                        payload: respBody,
                    })

                    reloadAuthorized()
                    const urlParams = new URL(window.location.href)
                    const params = getPageQuery()
                    let { redirect } = params
                    if (redirect) {
                        const redirectUrlParams = new URL(redirect)
                        if (redirectUrlParams.origin === urlParams.origin) {
                            redirect = redirect.substr(urlParams.origin.length)
                            if (redirect.match(/^\/.*#/)) {
                                redirect = redirect.substr(redirect.indexOf('#') + 1)
                            }
                        } else {
                            redirect = null
                        }
                    }
                    yield put(routerRedux.replace(redirect || '/'))
                }else{
                    notification.error({
                        message: '登录失败！用户名或密码错误',
                    });

                }
            }else {
                notification.error({
                    message: '登录失败！用户名或密码错误',
                });

            }
        },

        *logout(_, { put }) {
            yield put({
                type: 'changeLogout',
                payload: {
                    status: false,
                    currentAuthority: [],
                },
            })
            reloadAuthorized()
            // redirect
            if (window.location.pathname !== '/user/login') {
                yield put(
                    routerRedux.replace({
                        pathname: '/user/login',
                        search: stringify({
                            redirect: window.location.href,
                        }),
                    })
                )
            }
        },
    },

    reducers: {
        changeLoginStatus(state, { payload }) {
            try {
                    const token= payload.sToken
                    const iUid=payload.iUid
                    const Authority=payload.Authority
                    const userToken={"uid":iUid,"token":token,"Authority":Authority}
                //保存token信息
                    setUserToken(userToken)
                    //set Auth
                    // setAuthority(Authority)
                    // setAuthority(payload.currentAuthority)

                return {
                    ...state,
                    status: payload.status,
                    type: payload.type,
                }
            }catch(e){
                notification.error({
                    message: '登录失败！请重新登录',
                });
            }
        },

        changeLogout(state,{payload}){
            removeUserToken()
            return{
                ...state,

            }

        }
    },
}



