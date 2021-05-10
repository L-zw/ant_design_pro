
import { request } from '@/services/request'
import {getUserToken} from '@/utils/authority'
const {uid,token} =getUserToken()
export default {
  namespace: 'user',

  state: {
    list: [],
    currentUser: {"name":"用户名"},
  },

  effects: {
    *fetchCurrent(_, { call, put }) {
      const payload={
        "svr_name":"CAD.OpUserMngSvr",
        "method_name":"GetUserInfo",
        "req_body":{
          "iUid":uid,
          "sToken":token
        }
      }
      const response = yield call(request,payload);
      try{
        const userData=response.data
        if(userData.hasOwnProperty("resp_code")&&userData.resp_code===0){
          const respBody=userData.resp_body
          if(respBody.eRetCode===0){
            let userInfo=respBody.oUserInfo
            userInfo.name=userInfo.sUserName
            yield put({
              type: 'saveCurrentUser',
              payload: userInfo,
            });

          }
        }
      }catch (e) {

      }

    },
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
    saveCurrentUser(state, action) {

      return {
        ...state,
        currentUser: action.payload || {},

      };
    },
    changeNotifyCount(state, action) {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          notifyCount: action.payload.totalCount,
          unreadCount: action.payload.unreadCount,
        },
      };
    },
  },
};
