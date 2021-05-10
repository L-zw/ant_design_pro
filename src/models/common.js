import { request } from '@/services/request'
import { message } from 'antd'

export default {
    namespace: 'common',
    state: {
        // 取数据返回结果
        dataResp: {},
        // 更新返回结果
        updateResp: {}

    },
    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(request, payload)
            yield put({
                type: 'save',
                payload: response.data,
            })
        },
        *update({payload},{call,put}){
            const response = yield call(request,payload)
            yield put({
                type: 'updateSave',
                payload: response.data
            })
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                dataResp: action.payload,
            }
        },
        // 更新
        updateSave(state,action){
            return {
                ...state,
                updateResp: action.payload,
            }
        }
    },
}
