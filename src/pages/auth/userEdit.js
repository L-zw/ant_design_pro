import React, {Component} from 'react'
import {connect} from 'dva'
import {
    Form,
    Input,
    Select,
    Button,
    Card,
    Modal,
    message,
    Icon,
} from 'antd'
import {getUserToken} from '../../utils/authority'
import {getQueryPath} from '@/utils/storage'
import {
    superRoleId,
    platformRoleId,
    sellRoleId,
    operationsRoleId,
} from '@/utils/conf'
import router from 'umi/router'
import MD5 from 'crypto-js/md5'
import PageHeaderWrapper from '@/components/PageHeaderWrapper'

const FormItem = Form.Item
const {Option} = Select
const {uid, token, roleId} = getUserToken()


@connect(({authUser, common}) => ({
    authUser,
    common
}))
@Form.create(
    {}
)
class UserForms extends Component {
    static defaultProps = {}
    state = {
        data: {},
        edit: false,
        roleId: 0,
        randomPwd: '',
        routerUid: 0,
        assignRoleList: [], // 分配角色列表
        roleName: '',
        phoneTip: false, // 手机号提示
        visible: false,
    }

    componentDidMount() {
        const takeQueryPaths = getQueryPath()
        const pathName = this.props.location.pathname
        let query = {}
        if (Object.keys(takeQueryPaths).includes(pathName)) {
            query = takeQueryPaths[pathName]
        }
        let routerUid = parseInt(query.uid)
        let newRoleName = query.roleName
        let newRoleId = parseInt(query.roleId)
        let roleItem = {
            iId: newRoleId,
            sName: newRoleName,
        }
        this.getAssignRole(roleItem)

        let edit = false
        if (routerUid > 0) {
            let params = {
                iUid: uid,
                listUid: [routerUid]
            }
            this.getUser(params)
            edit = true
        }

        this.setState({
            routerUid,
            edit
        })
    }


    /*
        * 接口
        * */
    // 拉取用户信息
    getUser = (params) => {
        const {dispatch} = this.props
        dispatch({
            type: 'authUser/fetch',
            payload: {
                "svr_name": "YSSQ.WebUserMngSvr",
                "method_name": "GetUserInfoById",
                "req_body": params
            }
        }).then(() => {
            const {authUser} = this.props
            const respData = authUser.respBody
            try {
                if (respData.hasOwnProperty("resp_code") && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        let userInfo = respBody.listUser[0]
                        this.setState({
                            data: userInfo,
                            roleId: userInfo.iRoleId,
                        })
                    } else {
                        message.error("拉取用户信息失败！")
                    }
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 拉取可分配的角色
    getAssignRole = (roleItem) => {
        const {dispatch} = this.props
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebRoleAuthSvr",
                "method_name": "GetUserRoleAssignList",
                "req_body": {
                    iUid: uid,
                    sToken: token
                }
            }
        }).then(() => {
            const {common} = this.props
            const respData = common.dataResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        let hasItem = false
                        respBody.listRole.map((item) => {
                            if (item.iId === roleItem.iId) {
                                hasItem = true
                            }
                        })
                        if (!hasItem && roleItem.iId) {
                            respBody.listRole.unshift(roleItem)
                        }
                        this.setState({
                            assignRoleList: respBody.listRole
                        })
                    } else {
                        message.error("拉取分配列表失败！")
                    }
                } else {
                    message.error('服务器出错了！')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 校验手机号是否重复
    checkPhoneRepeat = () => {
        let phone = this.props.form.getFieldValue("sPhone")
        //   检查手机号是否重复
        const {dispatch} = this.props
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebUserMngSvr",
                "method_name": "IsPhoneDuplicate",
                "req_body": {
                    "iUid": uid,
                    "sToken": token,
                    "sPhone": phone
                }
            }
        }).then(() => {
            const {common} = this.props
            try {
                const {dataResp} = common
                if (dataResp.hasOwnProperty("resp_code") && dataResp.resp_code === 0) {
                    const respBody = dataResp.resp_body
                    if (respBody.eRetCode === 0) {
                        if (respBody.bDuplicate) {
                            this.setState({
                                phoneTip: true
                            })
                        }
                    } else {
                    }
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 获取随机密码，该函数已废弃，现令初始密码为 123456 
    getRamPwd = () => {
        const {dispatch} = this.props
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.CadConfSvr",
                "method_name": "CreateRandomPasswd",
                "req_body": {
                    "iUid": uid,
                }
            }
        }).then(() => {
            const {common} = this.props
            try {
                const {dataResp} = common
                let flag = false
                if (dataResp.hasOwnProperty("resp_code") && dataResp.resp_code === 0) {
                    const respBody = dataResp.resp_body
                    if (respBody.eRetCode === 0) {
                        flag = true
                        const sPassWd = respBody.sPassWds
                        this.setState({
                            randomPwd: sPassWd
                        })
                        this.props.form.setFieldsValue({
                            sPassWd,
                        })
                    }
                }
                if (!flag) {
                    message.error("获取随机密码失败,请重新获取")
                }
            } catch (e) {
                message.error("获取随机密码失败,请重新获取")
            }
        })
    }


    /*
    * 逻辑
    * */
    // 路由跳转
    routerJump = (path) => {
        router.push({
            pathname: path,
            query: {
            },
        })
    }

    // 校验密码格式
    checkPassWd(rule, value, callback) {
        if (!value) {
            callback()
        } else if (!(/^[0-9a-zA-Z]+$/.test(value))) {
            callback("密码只能由字母数字组成，请重新填写")
        } else {
            callback()
        }
    }

    // 校验手机号
    checkPhone(rule, value, callback) {
        if (!value) {
            callback()
        } else if (!(/^1(2|3|4|5|7|8)\d{9}$/.test(value))) {
            callback("手机号有误,请重新填写")
        } else if (value.length < 11) {
            callback("手机号不能少于11位")
        } else if (value.length > 11) {
            callback("手机号不能超过11位")
        } else {
            callback()
        }
    }

    // 当手机输入框获得焦点时，如果提醒弹窗已处于打开状态，则将其关闭
    focusHandle = () => {
        if (this.state.phoneTip) {
            this.setState({
                phoneTip: false
            })
        }
    }

    // 改变用户角色身份
    changeIRoleStatus = (roleId, option) => {
        this.setState({
            roleId,
            roleName: option.props.children
        })
    }

    // 表单确认（含创建用户、编辑用户接口）
    handleSubmit = e => {
        e.preventDefault()

        const {dispatch, form} = this.props
        // 判断是新增or编辑
        const {edit, data} = this.state
        if (edit) {
            Modal.confirm({
                title: "提示",
                content: "确定要更改该用户信息吗？",
                onOk: () => {
                    form.validateFieldsAndScroll((err, values) => {
                        let params = {
                            ...data,
                            ...values,
                        }
                        if (!err) {
                            dispatch({
                                type: 'authUser/update',
                                payload: {
                                    "svr_name": "YSSQ.WebUserMngSvr",
                                    "method_name": "EditUserInfo",
                                    "req_body": {
                                        iUid: uid,
                                        sToken: token,
                                        oUserInfo: params,
                                    }
                                },
                            }).then(() => {
                                const {authUser} = this.props
                                const respData = authUser.updateResp
                                try {
                                    if (respData.hasOwnProperty("resp_code") && respData.resp_code === 0) {
                                        const respBody = respData['resp_body']
                                        if (respBody.eRetCode === 0) {
                                            this.routerJump("/auth/role")
                                            message.success("操作成功！")
                                        } else if (respBody.eRetCode === 19) {
                                            message.error("该角色下只能存在一个用户！")
                                        } else {
                                            message.error("操作失败！")
                                        }
                                    }
                                } catch (e) {
                                    console.log("e", e)
                                }
                            })
                        }
                    })
                }
            })
        } else {
            form.validateFieldsAndScroll((err, values) => {
                if (!err) {
                    const data = {
                        ...values,
                        iUid: 0,
                        sPassWd: MD5(values.sPassWd).toString(),
                    }
                    dispatch({
                        type: 'authUser/update',
                        payload: {
                            "svr_name": "YSSQ.WebUserMngSvr",
                            "method_name": "CreateUser",
                            "req_body": {
                                iUid: uid,
                                sToken: token,
                                oUserInfo: data,
                            }
                        },
                    }).then(() => {
                        const {authUser} = this.props
                        const respData = authUser.updateResp
                        try {
                            if (respData.hasOwnProperty("resp_code") && respData.resp_code === 0) {
                                const respBody = respData['resp_body']
                                if (respBody.eRetCode === 0) {
                                    message.success("操作成功！")
                                    this.routerJump("/auth/role")
                                } else if (respBody.eRetCode === 111) {
                                    this.setState({
                                        phoneTip: true
                                    })
                                } else if (respBody.eRetCode === 19) {
                                    message.error("该角色下只能存在一个用户！")
                                } else {
                                    message.error('操作失败！')
                                }
                            }
                        } catch (e) {
                            console.log("e", e)
                        }
                    })
                }
            })
        }
    }


    /*
    * 渲染
    * */
    renderForm = (flag, data) => {
        const {
            form: {getFieldDecorator, getFieldValue},
        } = this.props

        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 8},
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 10},
                md: {span: 8},
            },
        }
        const isEdit = this.state.edit
        const userInfo = this.state.data
        const {phoneTip} = this.state

        if (isEdit) {
            return [
                <FormItem {...formItemLayout} label="手机号">
                    {getFieldDecorator('sPhone', {
                        rules: [
                            {required: true, message: '请输入手机号！'},
                            {validator: this.checkPhone},
                        ],
                        initialValue: userInfo.sPhone
                    })(
                        <Input placeholder="请输入手机号" disabled/>
                    )}
                </FormItem>,

                <FormItem {...formItemLayout} label="姓名">
                    {getFieldDecorator('sName', {
                        rules: [
                            {required: true, message: '请输入姓名！'},
                        ],
                        initialValue: userInfo.sName
                    })(
                        <Input placeholder="请输入姓名"/>
                    )}
                </FormItem>,

                <FormItem {...formItemLayout} label="角色">
                    {getFieldDecorator('iRoleId', {
                        rules: [
                            {required: true, message: '请选择用户角色！'}
                        ],
                        initialValue: userInfo.iRoleId
                    })(
                        <Select onChange={this.changeIRoleStatus} placeholder="请选择用户角色" >
                            {this.renderRoleChoice()}
                        </Select>
                    )}
                </FormItem>,

                <FormItem {...formItemLayout} label="备注">
                    {getFieldDecorator('sRemarks', {
                        rules: [],
                        initialValue: userInfo.sRemarks
                    })(
                        <Input.TextArea placeholder="请输入备注"/>
                    )}
                </FormItem>,
            ]
        } else {
            return [
                <FormItem {...formItemLayout} label="手机号">
                    {getFieldDecorator('sPhone', {
                        rules: [
                            {required: true, message: '请输入手机号！'},
                            {validator: this.checkPhone}
                        ],
                        validateTrigger: 'onBlur',
                        initialValue: userInfo.sPhone
                    })(
                        <Input
                            onFocus={this.focusHandle} onBlur={this.checkPhoneRepeat} placeholder="请输入手机号"/>
                    )}
                    <div>
                        {phoneTip ? <div style={{
                            position: 'absolute',
                            right: -250,
                            top: -6,
                            background: 'white',
                            boxShadow: ' -2px 2px 6px 3px rgba(108,108,108,0.2)',
                            borderRadius: 4
                        }}>
                            <div style={{
                                width: 0,
                                height: 0,
                                border: '8px solid transparent',
                                borderRightColor: 'white',
                                position: 'relative',
                                left: -15,
                                top: 8
                            }}/>
                            <div style={{width: 220}}>
                                <div style={{color: 'red', margin: '-16px 0  0 18px'}}>
                                    <Icon type="close-circle" theme="filled" style={{marginRight: 8, fontSize: 16}}/>
                                    此账号已被占用
                                </div>
                                <div style={{margin: '-10px 0  0 18px'}}>请更换新的账号注册！</div>
                            </div>
                        </div> : null}
                    </div>
                </FormItem>,

                <FormItem {...formItemLayout} label="姓名">
                    {getFieldDecorator('sName', {
                        rules: [
                            {required: true, message: '请输入姓名！'},
                        ],
                        initialValue: userInfo.sName
                    })(
                        <Input placeholder="请输入姓名"/>
                    )}
                </FormItem>,

                <FormItem {...formItemLayout} label="密码">
                    {getFieldDecorator('sPassWd', {
                        rules: [
                            {required: true, message: '请输入密码！'},
                            {validator: this.checkPassWd}
                        ],
                        validateTrigger: 'onBlur',
                        initialValue: '123456'
                    })(
                        <Input placeholder="请输入密码"/>
                    )}
                    {/*<a style={{position: 'absolute', top: '-12px', right: '-150px'}} onClick={() => this.getRamPwd()}>获取随机密码</a>*/}
                </FormItem>,

                <FormItem {...formItemLayout} label="角色">
                    {getFieldDecorator('iRoleId', {
                        rules: [{required: true, message: '请选择用户角色！'}],
                        initialValue: userInfo.iRoleId
                    })(
                        <Select onChange={this.changeIRoleStatus} placeholder="请选择用户角色">
                            {this.renderRoleChoice()}
                        </Select>
                    )}
                </FormItem>,

                <FormItem {...formItemLayout} label="备注">
                    {getFieldDecorator('sRemarks', {
                        rules: [
                        ],
                        initialValue: userInfo.sRemarks
                    })(
                        <Input.TextArea placeholder="请输入备注"/>
                    )}
                </FormItem>,
            ]
        }
    }

    // 下拉框选项
    renderRoleChoice() {
        const {assignRoleList} = this.state
        if (assignRoleList.length > 0) {
            return (
                assignRoleList.map((item) => {
                    return (<Option key={item.iId} value={item.iId}>{item.sName}</Option>)
                })
            )
        } else {
            return null
        }
    }


    render() {
        const {edit, data} = this.state
        const submitFormLayout = {
            wrapperCol: {
                xs: {span: 24, offset: 0},
                sm: {span: 10, offset: 10},
            },
        }

        return (
            <PageHeaderWrapper title={edit ? "用户资料编辑" : "新建用户"} content="用户相关信息">
                <Card bordered={false}>
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{marginTop: 8, position: 'relative'}}>
                        {this.renderForm(false, data)}
                        <FormItem {...submitFormLayout} style={{marginTop: 32}}>
                            <Button type="primary" htmlType="submit">
                                确定
                            </Button>
                            <Button style={{marginLeft: 8}} onClick={() => {this.routerJump("/auth/role")}}>
                                取消
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </PageHeaderWrapper>
        )
    }
}

export default UserForms
