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
    Tag,
} from 'antd'
import {tranformDeviceName} from "../../utils/ad/device"
import {getUserToken} from '../../utils/authority'
import {
    superRoleId,
    platformRoleId,
    sellRoleId,
    operationsRoleId,
} from '@/utils/conf'
import MD5 from 'crypto-js/md5'
import styles from './userCenter.less'
import Authorized from '@/utils/Authorized'
import PageHeaderWrapper from '@/components/PageHeaderWrapper'

const {uid, token, roleId} = getUserToken()
const FormItem = Form.Item
const {Option} = Select


@connect(({user, common}) => ({
    user,
    common,
}))
@Form.create()
class UserCenter extends Component {
    static defaultProps = {}
    state = {
        data: {},
        uid: 0,
        roleId: 0,
        isChangePwd: false,
        assignRoleList: [],
    }

    componentWillMount() {
        const {currentUser} = this.props.user
        const roleName = currentUser.sRoleName
        let assignRoleList = []
        assignRoleList.push({iId: roleId, sName: roleName})
        this.setState({
            uid: uid,
            assignRoleList,
        }, () => {
            this.props.form.setFieldsValue({
                iRoleId: this.state.assignRoleList[0].iId,
            })
        })
    }

    componentDidMount() {
        const {dispatch} = this.props
        // 获取用户信息
        if (uid > 0) {
            dispatch({
                type: 'common/fetch',
                payload: {
                    "svr_name": "YSSQ.WebUserMngSvr",
                    "method_name": "GetUserInfo",
                    "req_body": {
                        iUid: uid,
                        sToken: token,
                    }
                }
            }).then(() => {
                const {common} = this.props
                try {
                    const respData = common.dataResp
                    if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                        const respBody = respData['resp_body']
                        if (respBody.eRetCode === 0) {
                            let userInfo = respBody.oUser
                            let roleId = userInfo.iRoleId
                            this.setState({
                                data: userInfo,
                                roleId
                            })
                        }
                    }
                } catch (e) {
                    console.log("e", e)
                }
            })
        }
    }


    /*
    * 接口
    * */
    // 检验原密码
    validatePwd = (rule, value, callback) => {
        const {dispatch} = this.props
        const data = this.state.data
        const val = {
            sPhone: data.sPhone,
            sPassWd: value !== "undefined" ? MD5(value).toString() : ""
        }
        dispatch({
            type: "common/update",
            payload: {
                "svr_name": "YSSQ.WebUserMngSvr",
                "method_name": "UserLogin",
                "req_body": val
            }
        }).then(() => {
            const {common} = this.props
            const respData = common.updateResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        callback()
                    } else {
                        callback("密码错误！")
                    }
                } else {
                    callback("密码错误！")
                }
            } catch (e) {
                console.log("e", e)
                callback("密码错误！")
            }
        })
    }

    // 更改密码修改状态
    changePwdStatus = () => {
        this.setState({
            isChangePwd: true
        })
    }


    handleSubmit = e => {
        e.preventDefault()

        const {dispatch, form} = this.props
        const {data} = this.state
        form.validateFieldsAndScroll((err, values) => {
            if (this.state.isChangePwd) {
                // if (values.hasOwnProperty("rawPwd")) {
                //     delete values.rawPwd
                // }
                if (values.hasOwnProperty("confirm")) {
                    delete values.confirm
                }
                // values.sPassWd = MD5(values.sPassWd).toString()
                // values = {
                //     ...data,
                //     ...values,
                // }

                if (!err) {
                    Modal.confirm({
                        title: "提示",
                        content: "确定要修改你的密码吗？",
                        onOk: () => {
                            dispatch({
                                type: 'common/update',
                                payload: {
                                    "svr_name": "YSSQ.WebUserMngSvr",
                                    "method_name": "ChangePassword",
                                    "req_body": {
                                        iUid: uid,
                                        sToken: token,
                                        sOldPassword: MD5(values.rawPwd).toString(),
                                        sNewPassword: MD5(values.sPassWd).toString(),
                                    }
                                },
                            }).then(() => {
                                const {common} = this.props
                                const respData = common.updateResp
                                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                                    const updateResp = respData['resp_body']
                                    if (updateResp.eRetCode === 0) {
                                        message.success("密码修改成功！")
                                        if (this.state.isChangePwd) {
                                            this.cancelPwdStatus()
                                        }
                                    } else {
                                        message.error("密码修改失败")
                                    }
                                } else {
                                    message.error('服务器出错了！')
                                }
                            })
                        }
                    })
                }
            } else {
                values = {
                    ...data,
                    ...values,
                }
                if (!err) {
                    Modal.confirm({
                        title: "提示",
                        content: "确定要更新你的用户信息吗？",
                        onOk: () => {
                            dispatch({
                                type: 'common/update',
                                payload: {
                                    "svr_name": "YSSQ.WebUserMngSvr",
                                    "method_name": "EditUserInfo",
                                    "req_body": {
                                        iUid: uid,
                                        sToken: token,
                                        oUserInfo: values,
                                    }
                                },
                            }).then(() => {
                                const {common} = this.props
                                const respData = common.updateResp
                                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                                    const updateResp = respData['resp_body']
                                    if (updateResp.eRetCode === 0) {
                                        message.success("操作成功！")
                                        if (this.state.isChangePwd) {
                                            this.cancelPwdStatus()
                                        }
                                    } else {
                                        if (updateResp.eRetCode === 19) {
                                            message.error("该角色下只能存在一个用户！")
                                            return
                                        }
                                        if (this.state.isChangePwd) {
                                            message.error("操作失败,新密码不能与原始密码相同！")
                                        } else {
                                            message.error("操作失败")
                                        }
                                    }
                                } else {
                                    message.error('更改失败！')
                                }
                            })
                        }
                    })
                }
            }
        })
    }

    // 改变用户角色身份
    changeIRoleStatus = (roleId) => {
        this.setState({
            roleId
        })
    }

    // 取消修改密码
    cancelPwdStatus = () => {
        // 清空表单内容
        this.props.form.resetFields(['rawPwd', 'confirm', 'sPassWd', []])
        this.setState({
            isChangePwd: false
        })
    }

    //校验手机号码
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

    // 比较密码和确认密码
    compareNewPwd = (rule, value, callback) => {
        const form = this.props.form
        if (value && value !== form.getFieldValue('sPassWd')) {
            callback('两次密码输入不一致！')
        } else {
            callback()
        }
    }


    /*
    * 渲染
    * */
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
        const {data} = this.state
        const userInfo = data
        const submitFormLayout = {
            wrapperCol: {
                xs: {span: 24, offset: 0},
                sm: {span: 10, offset: 10},
            },
        }

        const {
            form: {getFieldDecorator},
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

        return (
            <PageHeaderWrapper title="个人中心" content="用户相关信息">
                <Card bordered={false}>
                    <div className={styles.baseView}>
                        <div className={styles.left}>
                            <Form layout="vertical" onSubmit={this.handleSubmit} hideRequiredMark>
                                {this.state.isChangePwd ? [

                                    <FormItem {...formItemLayout} label='原&nbsp;密&nbsp;码：'>
                                        {getFieldDecorator('rawPwd', {
                                            rules: [
                                                {
                                                    validator: this.validatePwd,
                                                }
                                            ],
                                            validateTrigger: 'onBlur'
                                        })(<Input placeholder="请输入原始密码" type='password'/>)}
                                    </FormItem>,

                                    <FormItem {...formItemLayout} label='新&nbsp;密&nbsp;码：'>
                                        {getFieldDecorator('sPassWd', {
                                            rules: [
                                                {
                                                    required: true,
                                                    message: "新密码不能为空",
                                                },
                                            ],
                                        })(<Input placeholder="请输入新密码" type='password'/>)}
                                    </FormItem>,

                                    <FormItem {...formItemLayout} label='确认密码：'>
                                        {getFieldDecorator('confirm', {
                                            rules: [
                                                {
                                                    required: true,
                                                    message: "请再次输入密码",
                                                },
                                                {
                                                    validator: this.compareNewPwd,
                                                }
                                            ],
                                            validateTrigger: 'onBlur'
                                        })(<Input placeholder="确认密码" type='password'/>)}
                                        <a style={{position: 'absolute', top: '-2px', right: '-40px'}} onClick={() => this.cancelPwdStatus()}>取消</a>
                                    </FormItem>
                                ] : [
                                    <FormItem {...formItemLayout} label="手机号：">
                                        {getFieldDecorator('sPhone', {
                                            rules: [
                                                {
                                                    required: true,
                                                    message: '请填写手机号码',
                                                },
                                                {validator: this.checkPhone}

                                            ],
                                            initialValue: userInfo.sPhone
                                        })(<Input placeholder="请输入手机号" disabled/>)}
                                    </FormItem>,

                                    <FormItem {...formItemLayout} label="姓名：">
                                        {getFieldDecorator('sName', {
                                            rules: [
                                                {
                                                    required: true,
                                                    message: '姓名不能为空',
                                                },
                                            ],
                                            initialValue: userInfo.sName
                                        })(<Input placeholder="请输入姓名"/>)}
                                    </FormItem>,

                                    <FormItem {...formItemLayout} label='密码：'>
                                        {getFieldDecorator('sPasswd', {
                                            rules: [
                                                {
                                                    message: "密码不能为空",
                                                },
                                            ],
                                            initialValue: userInfo.sPasswd
                                        })(<Input disabled placeholder="*******" type='password'/>)}
                                        <a style={{position: 'absolute', top: '-2px', right: '-40px'}} onClick={() => this.changePwdStatus()}>修改</a>
                                    </FormItem>,

                                    <FormItem {...formItemLayout} label="角色：">
                                        {getFieldDecorator('iRoleId', {
                                            rules: [{required: true, message: '请选择用户角色！'}],
                                            initialValue: userInfo.iRoleId
                                        })(<Select
                                            disabled
                                            onChange={this.changeIRoleStatus}
                                        >
                                            {this.renderRoleChoice()}
                                        </Select>)}
                                    </FormItem>,
                                ]}

                                <FormItem {...submitFormLayout} style={{marginTop: 32}}>
                                    <Button type="primary" htmlType="submit" style={{position: 'relative', right: '20%'}}>
                                        {this.state.isChangePwd ? "更改用户密码" : "更新基本信息"}
                                    </Button>
                                </FormItem>
                            </Form>
                        </div>
                    </div>
                </Card>
            </PageHeaderWrapper>
        )
    }
}

export default UserCenter
