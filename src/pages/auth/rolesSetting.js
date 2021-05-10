import React, {Component} from 'react'
import {connect} from 'dva'
import router from 'umi/router'
import GridContent from '@/components/PageHeaderWrapper/GridContent'
import styles from './rolesSetting.less'
import {FormattedMessage} from 'umi-plugin-react/locale'
import {Button, Form, Menu, message, Modal, Transfer} from 'antd'
import {getUserToken} from '../../utils/authority'

const {uid, token, roleId} = getUserToken()
const {Item} = Menu

@connect(({common}) => ({
    common,
}))

class RoleSettings extends Component {
    constructor(props) {
        super(props)
        const {match, location} = props
        this.state = {
            mode: 'inline',
            selectKey: '0',
            menu: [],
            targetKeys: [],
            allRoleList: [],
            roleList: [],

            targetRole: [],
            sourceRoleData: [],
            sourceAuthData:[],
            targetAuth:[]
        }
    }

    componentDidMount() {
        const {dispatch} = this.props

        // this.fetchRoleInfo(roleId)
        // this.fetchAuthInfo(roleId)

        // 拉取角色菜单
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebRoleAuthSvr",
                "method_name": "GetAllRoleList",
                "req_body": {
                    iUid: uid,
                    sToken: token,
                }
            }
        }).then(() => {
            const {common} = this.props
            try {
                const respData = common.dataResp
                if (respData.hasOwnProperty("resp_code") && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        let dataList = respBody.listRole
                        this.setState({
                            menu: dataList
                        })
                    } else {
                        message.error("拉取角色菜单失败！")
                    }
                } else {
                    message.error('服务器出错！')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 获取权限
    fetchAuthInfo(rId) {
        const {dispatch} = this.props
        const roleId = parseInt(rId)
        // 拉取用户权限列表
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebRoleAuthSvr",
                "method_name": "GetRoleAuthList",
                "req_body": {
                    iUid: uid,
                    sToken: token,
                    iRoleId: roleId,
                }
            }
        }).then(() => {
            const {common} = this.props
            const respData = common.dataResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        let dataList = respBody.listGrantedAuth
                        // 构造 targetAuth
                        const targetAuth = dataList.map((item) => {
                            return item.iId
                        })
                        // 构造 sourceAuthData
                        let sourceList = respBody.listAllAuth
                        const sourceAuthData = sourceList.map((item) => {
                            return {
                                "key": item.iId,
                                "title": item.sName,
                                "chosen": targetAuth.includes(item.iId)
                            }
                        })
                        this.setState({
                            sourceAuthData: sourceAuthData,
                            targetAuth: targetAuth
                        })
                    } else {
                        message.error("拉取角色权限失败！")
                    }
                }
            } catch (e) {
            }
        })
    }

    // 获取角色
    fetchRoleInfo(rId) {
        const {dispatch} = this.props
        const roleId = parseInt(rId)
        //拉取用户权限列表
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebRoleAuthSvr",
                "method_name": "GetRoleLowerList",
                "req_body": {
                    iUid: uid,
                    sToken: token,
                    iRoleId: roleId,
                }
            }
        }).then(() => {
            const {common} = this.props
            const respData = common.dataResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        let dataList = respBody.listAssignedRole
                        // 构造 targetRole
                        const targetRole = dataList.map((item) => {
                            return item.iId
                        })
                        // 构造 sourceRoleData
                        let sourceList = respBody.listAllRole
                        const sourceRoleData = sourceList.map((item) => {
                            return {
                                "key": item.iId,
                                "title": item.sName,
                                "chosen": targetRole.includes(item.iId)
                            }
                        })
                        this.setState({
                            sourceRoleData: sourceRoleData,
                            targetRole: targetRole
                        })
                    } else {
                        message.error("拉取角色失败！")
                    }
                }
            } catch (e) {
            }
        })
    }

    selectKey = ({key}) => {
        this.setSelectKey(key)
        this.fetchRoleInfo(key)
        this.fetchAuthInfo(key)
    }

    setSelectKey = (key) => {
        this.setState({
            selectKey: key,
        })
    }

    resize = () => {
        if (!this.main) {
            return
        }
        requestAnimationFrame(() => {
            let mode = 'inline'
            const {offsetWidth} = this.main
            if (this.main.offsetWidth < 641 && offsetWidth > 400) {
                mode = 'horizontal'
            }
            if (window.innerWidth < 768 && offsetWidth > 400) {
                mode = 'horizontal'
            }
            this.setState({
                mode,
            })
        })
    }

    handleAuthChange = (targetAuth, direction, moveKeys) => {
        this.setState({targetAuth})
    }

    handleRoleChange = (targetRole, direction, moveKeys) => {
        this.setState({targetRole})
    }

    handleSubmit = () => {
        const {dispatch} = this.props
        Modal.confirm(
            {
                title: "警告！",
                content: "确定要更新该用户的权限吗？",
                onOk: () => {
                    const roleId = parseInt(this.state.selectKey)
                    const targetRoleId = this.state.targetRole.map((item) => parseInt(item))
                    const targetAuthId = this.state.targetAuth.map((item) => parseInt(item))

                    dispatch({
                        type: 'common/update',
                        payload: {
                            "svr_name": "YSSQ.WebRoleAuthSvr",
                            "method_name": "EditRoleAuth",
                            "req_body": {
                                iUid: uid,
                                sToken: token,
                                iRoleId: roleId,
                                listConfAuthId: targetAuthId,
                                listAssignRoleId: targetRoleId,
                            }
                        }
                    }).then(() => {
                        const {common} = this.props
                        const respData = common.updateResp
                        try {
                            if (respData.hasOwnProperty("resp_code") && respData.resp_code === 0) {
                                const respBody = respData['resp_body']
                                if (respBody.eRetCode === 0) {
                                    message.success('更新成功！')
                                } else {
                                    message.error("更新失败")
                                }
                            }
                        } catch (e) {
                            message.error("更新失败")
                        }
                    })
                }
            }
        )
    }

    renderItem = item => {
        const customLabel = (
            <span className="custom-item">
                {item.title}
            </span>
        )

        return {
            label: customLabel, // for displayed item
            value: item.title, // for title and filter matching
        }
    }


    render() {
        const {mode, menu, selectKey} = this.state
        return (
            <GridContent>
                <div className={styles.main} ref={ref => {this.main = ref}}>
                    <div className={styles.leftmenu}>
                        <Menu mode={mode} selectedKeys={[selectKey]} onClick={this.selectKey}>
                            {menu.map((item) => {
                                return <Item key={item.iId}>{item.sName}</Item>
                            })}
                        </Menu>
                    </div>
                    <div className={styles.right}>
                        <div>
                            <Transfer
                                titles={['未授权功能', '已授权功能']}
                                dataSource={this.state.sourceAuthData}
                                listStyle={{
                                    width: 350,
                                    height: 600,
                                }}
                                targetKeys={this.state.targetAuth}
                                onChange={this.handleAuthChange}
                                render={this.renderItem}
                            />
                        </div>
                        <div style={{marginTop: 24}}>
                            <Transfer
                                titles={['未配置角色', '已配置角色']}
                                dataSource={this.state.sourceRoleData}
                                listStyle={{
                                    width: 350,
                                    height: 600,
                                }}
                                targetKeys={this.state.targetRole}
                                onChange={this.handleRoleChange}
                                render={this.renderItem}
                            />
                        </div>
                        <br/>
                        <Button type="primary" onClick={() => this.handleSubmit()}>更新权限功能
                        </Button>
                    </div>
                    <div style={{float: 'right', marginRight: 20}}>
                        <Button onClick={router.goBack}>返回</Button>
                    </div>
                </div>
            </GridContent>
        )
    }
}

export default RoleSettings
