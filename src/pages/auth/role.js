import React, {Fragment, Component} from 'react'
import PageHeaderWrapper from '@/components/PageHeaderWrapper'
import {
    Button,
    Card,
    Col,
    Table,
    Form,
    Input,
    Row,
    message,
    Divider,
    Dropdown,
    Menu
} from "antd"
import {connect} from "dva"
import {getAuthority, getUserToken} from '../../utils/authority'
import {getQueryPath, setQueryPath} from "../../utils/storage"
import styles from "./role.less"
import router from 'umi/router'
import moment from 'moment'
import MD5 from 'crypto-js/md5'
import download from "@/utils/download/downloadExcel"
import Authorized from '@/utils/Authorized'
import TipModal from '@/components/tipModal/index'

const {Item} = Menu
const FormItem = Form.Item
const formatDate = "YYYY-MM-DD"
const {uid, token, roleId} = getUserToken()

@connect(({user, common}) => ({
    user,
    common,
}))
@Form.create(
    {}
)
class UserAuth extends Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedRows: [],

            // model相关
            modalVisible: false,
            title: '删除用户',
            desc: '用户删除后，该账号将无法登陆本系统，是否确认删除该用户。',
            topColor: 'red',

            // table相关
            userLists: [], // 用户列表
            assignRoleList: [], // 分配角色列表
            totalCot: 0,
            formValues: {},
            iPageIndex: 1,
            iPageSize: 10,
            record: {}, // 单行删除时删除的对象
            handleType: 1, // 1是删除，2是重置
        }
    }

    columns = [
        {
            title: '用户ID',
            dataIndex: 'iUid',
            render: (val) => {
                return <span style={{whiteSpace: 'noWrap'}}>{val}</span>
            }
        },
        {
            title: '姓名',
            dataIndex: 'sName',
        },
        {
            title: '手机',
            dataIndex: 'sPhone',

        },
        {
            title: '角色',
            dataIndex: 'sRoleName',
        },
        {
            title: '备注',
            dataIndex: 'sRemarks',
        },
        {
            title: '操作',
            dataIndex: 'operation',
            render: (text, record) => {
                return [
                    <Fragment key={record.iUid}>
                        <Authorized authority={["1002"]}>
                            <a style={record.canEdit ? {opacity: 1, whiteSpace: 'noWrap'} : {cursor: 'default', color: '#c4c4c4', whiteSpace: 'noWrap'}}
                               onClick={() => { this.jumpNewPage(true, record)}}>编辑</a>
                            <Divider type="vertical"/>
                        </Authorized>

                        <Authorized authority={["1002"]}>
                            <a style={record.canEdit ? {opacity: 1, whiteSpace: 'noWrap'} : {cursor: 'default', color: '#c4c4c4', whiteSpace: 'noWrap'}}
                               onClick={() => this.handleResetPwd(record)}>重置密码</a>
                            <Divider type="vertical"/>
                        </Authorized>

                        <Authorized authority={["1001"]}>
                            <a style={record.canEdit ? {opacity: 1, whiteSpace: 'noWrap'} : {cursor: 'default', color: '#c4c4c4', whiteSpace: 'noWrap'}}
                               onClick={() => this.handleDelete(record)}>删除</a>
                        </Authorized>
                    </Fragment>
                ]
            }
        }
    ]

    componentDidMount() {
        const {iPageIndex, iPageSize} = this.state
        let params = {
            iUid: uid,
            sToken: token,
            iPageIndex,
            iPageSize,
        }
        this.fetchUserList(params)
        this.getRoleAssignList()
    }


    /*
    * 接口
    * */
    // 拉取用户列表
    fetchUserList = (params) => {
        const {dispatch} = this.props
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebUserMngSvr",
                "method_name": "GetUserList",
                "req_body": params
            }
        }).then(() => {
            const {common} = this.props
            const respData = common.dataResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        const userLists = respBody.listUser
                        const totalCot = respBody.iCount

                        // 添加是否可编辑的字段
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
                                        // 判断是否是下级用户
                                        userLists.map((item) => {
                                            item.canEdit = false
                                            if (roleId === 1 || roleId === 2) {
                                                item.canEdit = true
                                            } else {
                                                const temp = respBody.listAssignedRole.map((item) => {
                                                    return item.iId
                                                })
                                                item.canEdit = temp.includes(item.iRoleId)
                                            }
                                        })
                                        this.setState({
                                            userLists,
                                            totalCot
                                        })
                                    } else {
                                        message.error("拉取下级用户列表失败！")
                                    }
                                } else {
                                    message.error('服务器出错了！')
                                }
                            } catch (e) {
                                console.log("e", e)
                            }
                        })
                    } else {
                        message.error("拉取用户列表失败！")
                    }
                } else {
                    message.error('服务器出错了！')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 拉取分配角色列表
    getRoleAssignList = () => {
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
                        this.setState({
                            assignRoleList: respBody.listRole
                        })
                    } else {
                        message.error("拉取分配角色列表失败！")
                    }
                } else {
                    message.error('服务器出错了！')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 分配角色
    assignUserRole = (params) => {
        const {dispatch} = this.props
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebUserMngSvr",
                "method_name": "AssignUserRole",
                "req_body": params
            }
        }).then(() => {
            const {common} = this.props
            const respData = common.dataResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        message.success("分配成功！")
                        const {iPageIndex, iPageSize, formValues} = this.state
                        let params = {
                            iUid: uid,
                            sToken: token,
                            iPageIndex,
                            iPageSize,
                            oCond: {
                                ...formValues
                            },
                        }
                        this.fetchUserList(params)
                    } else {
                        message.error("分配角色失败！")
                    }
                } else {
                    message.error('服务器出错了！')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }


    /*
    * 逻辑
    * */
    // 查询
    handleSearch = (e) => {
        e.preventDefault()

        // 暂未修改
        const {form} = this.props
        form.validateFields((err, fieldsValue) => {
            if (err) return
            const values = {
                sName: fieldsValue.userName ? fieldsValue.userName.trim() : '',
                sPhone: fieldsValue.sPhone ? fieldsValue.sPhone : '',
                sRoleName: fieldsValue.roleName ? fieldsValue.roleName.trim() : '',
            }
            this.setState({
                formValues: values,
            })
            const params = {
                iUid: uid,
                sToken: token,
                iPageIndex: 1,
                iPageSize: 10,
                oCond: {
                    ...values
                },
            }
            this.fetchUserList(params)
        })
    }

    // 重置
    handleFormReset = () => {
        const {form} = this.props
        form.resetFields()
        this.setState({
            formValues: {},
        })
        const params = {
            iUid: uid,
            sToken: token,
            iPageIndex: 1,
            iPageSize: 10,
            oCond: {

            }
        }
        this.fetchUserList(params)
    }

    // 新建/编辑 跳转
    jumpNewPage = (isEdit, record) => {
        // 判断是否为空对象
        let uid = 0
        let roleName = ''
        let roleId = 0
        if (isEdit) { // 编辑
            if (!record.canEdit) {
                message.error('您没有编辑该用户的操作权限！')
                return
            }
            uid = record.iUid
            roleName = record.sRoleName
            roleId = record.iRoleId
        }
        const query = {
            uid: `${uid}`,
            roleName: roleName,
            roleId: roleId,
        }
        // 保存带参路由的路由参数
        const path = '/auth/user-edit'
        setQueryPath(path, query)
        // 跳转
        router.push({
            pathname: path,
        })
    }

    // 分配角色
    assignRole = (role) => {
        const {selectedRows} = this.state

        let canDelete = true
        selectedRows.map((item) => {
            if (!item.canEdit) {
                canDelete = false
            }
        })
        if (!canDelete) {
            message.error('请勿勾选无法分配的用户！')
            return
        }
        if (selectedRows.length === 0) {
            message.error("请选择要分配的用户！")
            return
        }

        let hasSupper = false
        selectedRows.map((item) => {
            if (item.iRoleId === 1) {
                hasSupper = true
            }
        })
        if (hasSupper) {
            message.error("请勿操作超级管理员！")
            return
        }

        let listAssignUid = []
        selectedRows.map((item) => {
            listAssignUid.push(item.iUid)
        })
        let params = {
            iUid: uid,
            sToken: token,
            iAssignRoleId: role.iId,
            listUid: listAssignUid,
        }
        this.assignUserRole(params)
    }

    // 导出excel
    downloadExl = () => {
        let rawData = this.state.selectedRows
        if (rawData.length === 0) {
            message.error("请选择要导出的数据")
            return
        }

        // let datas = _.clone(results) // 这里为了不影响项目的数据的使用 采用了lodash中的深克隆方法
        let datas = rawData

        let json = datas.map(item => { // 将json数据的键名更换成导出时需要的键名
            return {
                '用户ID': item.iUid,
                '姓名': item.sName,
                '手机': item.sPhone,
                '角色': item.sRoleName,
                '备注': item.sRemarks,
            }
        })
        download(json, '用户管理信息.xlsx') // 导出的文件名
    }

    // 删除 打开弹窗
    handleDelete = (record) => {
        let rows = []
        const arr = Object.keys(record)
        if (arr.length > 0) { // 删除单行
            if (!record.canEdit) {
                return
            }
            rows.push(record)
            this.setState({
                record, // 保存删除的单行
            })
        } else { // 批量删除
            let canDelete = true
            this.state.selectedRows.map((item) => {
                if (!item.canEdit) {
                    canDelete = false
                }
            })
            if (!canDelete) {
                message.error('请勿勾选无法删除的用户！')
                return
            }
            rows = this.state.selectedRows
        }
        if (rows.length === 0) {
            message.error('请选择要删除的数据！')
            return
        }
        this.setState({
            modalVisible: true,
            title: '删除用户',
            desc: '用户删除后，该账号将无法登陆本系统，是否确认删除该用户。',
            topColor: 'red',
            handleType: 1
        })
    }

    // 重置密码 打开弹窗
    handleResetPwd = (record) => {
        if (!record.canEdit) {
            message.error('您没有重置该用户密码的操作权限！')
            return
        }
        this.setState({
            record,
            modalVisible: true,
            title: '重置密码',
            desc: '重置密码后，该账号可能无法使用原密码登陆本系统，是否确认重置。',
            topColor: '#1585ff',
            handleType: 2
        })
    }

    // 选择行
    handleSelectRows = rows => {
        this.setState({
            selectedRows: rows,
        })
    }

    // 分页，筛选，排序等变化时触发的事件
    handleStandardTableChange = (pagination, filtersArg, sorter) => {
        const {formValues} = this.state
        const params = {
            iPageIndex: pagination.current,
            iPageSize: pagination.pageSize,
            iUid: uid,
            sToken: token,
            oCond: {
                ...formValues,
            }
        }
        this.fetchUserList(params)
        this.setState({
            iPageIndex: pagination.current,
            iPageSize: pagination.pageSize,
        })
    }

    // 删除、重置密码 弹窗 取消
    modalCancel = () => {
        this.setState({
            modalVisible: false,
            record: {}
        })
    }

    // 删除、重置密码 弹窗 确认
    modalConfirm = () => {
        const {dispatch} = this.props
        const {record, handleType} = this.state

        // 删除
        if (handleType === 1) {
            let rows = []
            let listUid = []
            const arr = Object.keys(record)
            if (arr.length > 0) {
                rows.push(record)
                listUid.push(record.iUid)
            } else {
                this.state.selectedRows.map((item) => {
                    rows.push(item)
                    listUid.push(item.iUid)
                })
            }
            if (rows.length > 0) {
                dispatch({
                    type: 'common/update',
                    payload: {
                        "svr_name": "YSSQ.WebUserMngSvr",
                        "method_name": "DelUsers",
                        "req_body": {
                            iUid: uid,
                            sToken: token,
                            listUid: listUid
                        }
                    }
                }).then(() => {
                    const {common} = this.props
                    const respData = common.updateResp
                    try {
                        if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                            const response = respData['resp_body']
                            if (response.eRetCode === 0) {
                                message.success('删除成功！')
                                // 删除本地数据
                                let dataList = this.state.userLists
                                rows.map((item) => {
                                    const idx = dataList.indexOf(item)
                                    if (idx >= 0) {
                                        dataList.splice(idx, 1)
                                    }
                                })
                                this.setState({userLists: dataList})
                            } else {
                                message.error('删除失败！')
                            }
                        }
                    } catch (e) {
                        console.log("e", e)
                    }
                })
            }
        }

        // 重置密码
        if (handleType === 2) {
            const item = {
                ...record,
                sPasswd: "reset"
            }
            dispatch({
                type: 'common/update',
                payload: {
                    "svr_name": "YSSQ.WebUserMngSvr",
                    "method_name": "ResetPassword",
                    "req_body": {
                        iUid: uid,
                        sToken: token,
                        iResetUid: item.iUid,
                    }
                }
            }).then(() => {
                const {common} = this.props
                const respData = common.updateResp
                try {
                    if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                        const response = respData['resp_body']
                        if (response.eRetCode === 0) {
                            message.success('重置密码成功！')
                        } else {
                            message.error('重置密码失败！')
                        }
                    }
                } catch (e) {
                    console.log("e", e)
                }
            })
        }

        //  重置record
        this.setState({
            record: {},
            modalVisible: false
        })
    }

    // 手机号正则检测
    checkPhone(rule, value, callback) {
        if (!value) {
            callback()
        } else if (!(/^[0-9]+$/.test(value))) {
            callback("请输入数字")
        } else {
            callback()
        }
    }


    /*
    * 渲染
    * */
    renderSimpleForm() {
        const {
            form: {getFieldDecorator},
        } = this.props
        return (
            <Form onSubmit={this.handleSearch} className={`${styles.searchInput} ${styles.formSearch}`}
                  style={{paddingBottom: '8px'}}>
                <Row gutter={16}>
                    <Col className="gutter-row" span={6}>
                        <FormItem label="姓名" className={styles.formSearch}>
                            {getFieldDecorator('userName',)(
                                <Input placeholder="请输入"/>
                            )}
                        </FormItem>
                    </Col>

                    <Col className="gutter-row" span={6}>
                        <FormItem label="手机" className={styles.formSearch}>
                            {getFieldDecorator('sPhone', {
                                rules: [{validator: this.checkPhone}],
                            })(
                                <Input placeholder="请输入"/>
                            )}
                        </FormItem>
                    </Col>
                    <Col className="gutter-row" span={6}>
                        <FormItem label="角色" className={styles.formSearch}>
                            {getFieldDecorator('roleName',)(
                                <Input placeholder="请输入"/>
                            )}
                        </FormItem>
                    </Col>
                    <Col className="gutter-row" span={6}>
                        <div style={{overflow: 'hidden', marginTop: "42px"}}>
                            <div>
                                <Button type="primary" htmlType="submit">
                                    搜索
                                </Button>
                                <Button style={{marginLeft: 8}} onClick={this.handleFormReset}>
                                    重置
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Form>
        )
    }

    render() {
        const {loading} = this.props
        const {selectedRows, selectedRowKeys, userLists, modalVisible, title, desc, topColor} = this.state
        const rowCheckSelection = {
            type: 'checkbox',
            selectedRowKeys,
            onChange: (selectedRowKeys, selectedRows) => {
                this.setState(() => ({
                    selectedRowKeys, // 必须要有的，设置了这个，页面上才会显示是否选中的状态
                    selectedRows
                }))
            }
        }

        // 分页
        const paginationProps = {
            total: this.state.totalCot,
            showTotal: () => {return `共${this.state.totalCot}条记录`},
            showQuickJumper: true,
            showSizeChanger: true,
        }

        const menu = <Menu>
            {this.state.assignRoleList.map((item) => {
                return <Item key={item.iId}>
                    <div style={{textAlign: 'center'}} onClick={() => this.assignRole(item)}> {item.sName} </div>
                </Item>
            })}
        </Menu>

        return (
            <PageHeaderWrapper title="用户列表" content="用户列表">
                <div>
                    <Row>
                        <Col span={24}>
                            <div className={styles.cardList} style={{width: "100%", paddingTop: "0px"}}>
                                <div>
                                    <Card title="用户管理" bordered={false} style={{width: "100%"}}>
                                        <div>
                                            <div>
                                                {this.renderSimpleForm()}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <div style={{paddingTop: "12px"}}>
                                <Card bordered={false}>
                                    <div className={styles.tableList}>
                                        <div className={styles.tableListOperator}>
                                            <Authorized authority={["1001"]}>
                                                <Button type="primary" icon="plus" onClick={() => this.jumpNewPage(false, {})}>新建</Button>
                                            </Authorized>

                                            <Authorized authority={["1003"]}>
                                                <Dropdown trigger={['click']} overlay={menu} placement="bottomCenter">
                                                    <Button icon="usergroup-delete">分配角色</Button>
                                                </Dropdown>
                                            </Authorized>

                                            <Authorized authority={["1004"]}>
                                                <Button icon="vertical-align-bottom" onClick={() => this.downloadExl(true)}>导出</Button>
                                            </Authorized>

                                            <Authorized authority={["1001"]}>
                                                <Button icon="delete" onClick={() => this.handleDelete({})}>删除</Button>
                                            </Authorized>
                                        </div>

                                        <Table
                                            rowKey={record => record.iUid}
                                            loading={loading}
                                            dataSource={userLists}
                                            columns={this.columns}
                                            selectedRowKeys={selectedRows}
                                            rowSelection={rowCheckSelection}
                                            onChange={this.handleStandardTableChange}
                                            pagination={paginationProps}
                                        />
                                    </div>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 弹窗 */}
                <TipModal
                    visible={modalVisible}
                    title={title}
                    desc={desc}
                    topColor={topColor}
                    onCancel={this.modalCancel}
                    onConfirm={this.modalConfirm}
                />
            </PageHeaderWrapper>
        )
    }
}

export default UserAuth


