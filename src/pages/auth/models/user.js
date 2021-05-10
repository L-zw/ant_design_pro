import { request } from '@/services/request'


export default {
    namespace: 'authUser',
    state: {
        respBody:{},
        updateResp:{},
        typeList:{},


    },
    effects:{
        *fetch({payload},{call,put}){
            const response = yield call(request,payload)
            yield put({
                type:'save',
                payload:response.data
            })
        },
        *update({payload},{call,put}){
            const response = yield call(request,payload)
            yield put({
                type:'saveUpdateResp',
                payload:response.data
            })

        },
        *getTypeList({payload},{call,put}){
            const response = yield call(request,payload)
            yield put({
                type:'typeList',
                payload:response.data
            })
        },
        *fetchRoleList({payload},{call,put}){
            const response = yield call(request,payload)
            yield put({
                type:'save',
                payload:response.data
            })

        },

    },
    reducers: {
        save(state, action) {
            const respBody= action.payload
            return {
                ...state,
                respBody: respBody,
            }
        },
        saveUpdateResp(state, action) {
            const respBody= action.payload
            return {
                ...state,
                updateResp: respBody,
            }
        },
        typeList(state, action) {
            const respBody= action.payload
            return {
                ...state,
                respBody: respBody,
            }
        }
    },
}
