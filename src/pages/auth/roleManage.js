import React, {Fragment, Component, PureComponent} from 'react'
import PageHeaderWrapper from '@/components/PageHeaderWrapper'
import {
    Button,
    Card,
    Col,
    Table,
    Form,
    Row,
    Select,
    Modal,
    message,
    Divider,
    Input,
} from "antd"
import {connect} from "dva"
import {getUserToken} from '../../utils/authority'
import {getQueryPath, setQueryPath} from "../../utils/storage"
import styles from "./roleManage.less"
import router from 'umi/router'
import Authorized from '@/utils/Authorized'
import TipModal from '@/components/tipModal/index'
import download from "@/utils/download/downloadExcel"
import moment from 'moment'

const FormItem = Form.Item
const formatDate = "YYYY-MM-DD"
const formatTime = "YYYY-MM-DD hh:mm:ss"
const {Option} = Select
const {uid, token, roleId} = getUserToken()

@connect(({user, common, loading}) => ({
    user,
    common,
    loading: loading.models.common,
    // loading: loading.effects['deviceTest/fetch'],
}))

@Form.create(
    {}
)
class roleManage extends Component {
    constructor(props) {
        super(props)
    }

    //  存放组件的状态
    state = {
        roleLists: [],
        selectedRowKeys: [],
        selectedRows: [],
        formValues: {},
        totalCot: 0,
        iPageIndex: 0,
        iPageSize: 0,
        modalVisible: false,
        visible: false, // 新建角色弹窗是否可见
        assignRoleList: [],
        record: {},
    }

    columns = [
        {
            title: '角色',
            dataIndex: 'sName',
        },
        {
            title: '角色人数',
            dataIndex: 'iUserCount',
        },
        {
            title: '操作',
            dataIndex: 'operation',
            render: (text, record) => {
                return [
                    <Fragment key={record.iRoleId}>
                        <a onClick={() => {this.lookDetail(record)}}>查看</a>
                        <Authorized authority={["1006"]}>
                            <Divider type="vertical"/>
                            <a onClick={() => this.handleDelete(record)}>删除</a>
                        </Authorized>
                    </Fragment>
                ]
            }
        }
    ]

    componentDidMount() {
        let params = {
            iUid: uid,
            sToken: token,
            iPageIndex: 1,
            iPageSize: 10,
        }
        this.getRoleList(params)
    }


    /*
    * 接口
    * */
    // 拉取角色列表
    getRoleList = (params) => {
        const {dispatch} = this.props
        dispatch({
            type: 'common/fetch',
            payload: {
                "svr_name": "YSSQ.WebRoleAuthSvr",
                "method_name": "GetUserRoleMngList",
                "req_body": params
            }
        }).then(() => {
            const {common}= this.props
            const respData = common.dataResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        this.setState({
                            roleLists: respBody.listRole,
                            totalCot: respBody.iRoleCount
                        })
                    } else {
                        message.error("拉取角色列表失败！")
                    }
                } else {
                    message.error('服务器出错了')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 拉取可分配的角色
    getAssignRole = () => {
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
            const {common}= this.props
            const respData = common.dataResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        const {currentUser} = this.props.user
                        const roleName = currentUser.sRoleName
                        let item = {iId: roleId, sName: roleName}
                        respBody.listRole.unshift(item)
                        this.setState({
                            assignRoleList: respBody.listRole
                        })
                    } else {
                        message.error("拉取分配列表失败！")
                    }
                } else {
                    message.error('服务器出错了')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 新建角色
    newRole = (params) => {
        const {dispatch} = this.props
        dispatch({
            type: 'common/update',
            payload: {
                "svr_name": "YSSQ.WebRoleAuthSvr",
                "method_name": "CreateRole",
                "req_body": params
            }
        }).then(() => {
            const {common} = this.props
            const respData = common.updateResp
            try {
                if (respData.hasOwnProperty('resp_code') && respData.resp_code === 0) {
                    const respBody = respData['resp_body']
                    if (respBody.eRetCode === 0) {
                        message.success("角色新建成功！")
                        let params = {
                            iUid: uid,
                            sToken: token,
                            iPageIndex: 1,
                            iPageSize: 10,
                        }
                        this.getRoleList(params)
                        this.setState({
                            visible: false,
                        })
                        this.props.form.resetFields()
                    } else {
                        if (respBody.eRetCode === 4) {
                            message.error("角色名称已存在！")
                        } else {
                            message.error("新建角色失败！")
                        }
                    }
                } else {
                    message.error('服务器出错了')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }


    /*
    * 逻辑
    * */
    // 刷新数据
    refreshData = ()=>{
        let params = {
            iUid: uid,
            sToken: token,
            iPageIndex: 1,
            iPageSize: 10,
        }
        this.getRoleList(params)
    }

    // 新建
    addRole = () => {
        this.getAssignRole()
        this.setState({
            visible: true
        })
    }

    // 导出excel
    downloadExl = () => {
        let rawData = this.state.selectedRows
        if (rawData.length === 0) {
            message.error("请选择要导出的数据！")
            return
        }

        // let datas = _.clone(results)//这里为了不影响项目的数据的使用 采用了lodash中的深克隆方法
        let datas = rawData

        let json = datas.map(item => { // 将json数据的键名更换成导出时需要的键名
            return {
                '角色': item.sName,
                '角色人数': item.iUserCount,
            }
        })
        download(json, '角色管理信息.xlsx') // 导出的文件名
    }

    // 删除
    handleDelete = (record) => {
        // 平台或公司无法删除
        console.log(record)
        let rows = []
        const arr = Object.keys(record)

        if (arr.length > 0) {
            rows.push(record)
            this.setState({
                record, // 保存删除的单条
            })
        } else {
            rows = this.state.selectedRows
        }
        if (rows.length === 0) {
            message.error('请选择要删除的数据！')
            return
        }
        let hasUser = false // 有用户不能删除
        rows.map((item) => {
            if (item.iUserCount > 0) {
                hasUser = true
            }
        })
        if (hasUser) {
            message.error('无法删除已存在用户的角色！')
            return
        }
        this.setState({
            modalVisible: true
        })
    }

    // 查看角色
    lookDetail = (record) => {
        let routerRecord = JSON.stringify(record)
        const query = {
            role: `${routerRecord}`,
        }
        // 保存带参路由的路由参数
        const path = '/auth/role-detail'
        setQueryPath(path, query)
        // 跳转
        router.push({
            pathname: path,
        })
    }

    // 分页改变
    handleStandardTableChange = (pagination, filtersArg, sorter) => {
        const {formValues} = this.state
        const params = {
            iPageIndex: pagination.current,
            iPageSize: pagination.pageSize,
            iUid: uid,
            sToken: token,
        }
        this.getRoleList(params)
    }

    // 删除弹窗 确认
    modalConfirm = () => {
        // 确认删除
        const {dispatch} = this.props
        const {record} = this.state
        // 删除
        let rows = []
        let listUid = []
        const arr = Object.keys(record)
        if (arr.length > 0) {
            rows.push(record)
            listUid.push(record.iId)
        } else {
            rows = this.state.selectedRows
            rows.map((item) => {
                rows.push(item.iId)
                listUid.push(item.iId)
            })
        }
        if (rows.length > 0) {
            dispatch({
                type: 'common/update',
                payload: {
                    "svr_name": "YSSQ.WebRoleAuthSvr",
                    "method_name": "DeleteRole",
                    "req_body": {
                        iUid: uid,
                        sToken: token,
                        listRoleId: listUid
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
                            //删除本地数据
                            let dataList = this.state.roleLists
                            rows.map((item) => {
                                const idx = dataList.indexOf(item)
                                if (idx >= 0) {
                                    dataList.splice(idx, 1)
                                }
                            })
                            this.setState({roleLists: dataList})
                        } else {
                            message.error('删除失败！')
                        }
                    }
                } catch (e) {
                    console.log("e", e)
                }
            })
        }

        //  重置record
        this.setState({
            modalVisible: false,
            record: {}
        })
    }

    // 删除弹窗 取消
    modalCancel = () => {
        this.setState({
            modalVisible: false,
            record: {}
        })
    }

    // 新建弹窗 确认
    handleOk = (e) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                let params = {
                    iUid: uid,
                    sToken: token,
                    sRoleName: values.sRoleName,
                    iUpperRoleId: values.iUpperRoleId
                }
                this.newRole(params)
            }
        })
    }

    // 新建弹窗 取消
    handleCancel = e => {
        this.setState({
            visible: false,
        })
        this.props.form.resetFields()
    }

    // 分配角色权限
    handleAssign = () => {
        router.push({
            pathname:  '/auth/role-setting',
        })
    }


    /*
    * 渲染
    * */
    //下拉框选项
    renderSelectChoice() {
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

    renderNewRoleForm = () => {
        const {getFieldDecorator} = this.props.form
        return (
            <Form labelCol={{span: 5}} wrapperCol={{span: 17}}>
                <Form.Item label="角色名称">
                    {getFieldDecorator('sRoleName', {
                        rules: [
                            {required: true, message: '请输入角色名称!'}, {max: 15, message: '请勿超过15个字符!'}
                            ],
                    })(<Input placeholder='请输入角色名称'/>)}
                </Form.Item>

                <Form.Item label="角色所属">
                    {getFieldDecorator('iUpperRoleId', {
                        rules: [
                            {required: true, message: '请选择所属角色!'}
                            ],
                    })(
                        <Select placeholder="请选择所属角色">
                            {this.renderSelectChoice()}
                        </Select>,
                    )}
                </Form.Item>
            </Form>
        )
    }


    render() {
        const {loading} = this.props
        const {selectedRows, selectedRowKeys, roleLists, totalCot, modalVisible} = this.state
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
        //分页
        const paginationProps = {
            total: totalCot,
            showTotal: () => {return `共${this.state.totalCot}条记录 `},
            showQuickJumper: true,
            showSizeChanger: true,

        }

        return (
            <div className={styles.roleManage}>
                <PageHeaderWrapper title="角色管理" content="用户角色管理列表">
                    <div>
                        <Row>
                            <Col span={24}>
                                <div>
                                    <Card bordered={false}>
                                        <div className={styles.tableList}>
                                            <div className={styles.tableListOperator}>
                                                <Authorized authority={["1006"]}>
                                                    <Button type="primary" icon="plus" onClick={() => this.addRole()}>
                                                        新建
                                                    </Button>
                                                </Authorized>

                                                <Button icon="vertical-align-bottom" onClick={() => this.downloadExl(true)}>
                                                    导出
                                                </Button>

                                                <Authorized authority={["1006"]}>
                                                    <Button style={{marginLeft: 8}} icon="delete" onClick={() => this.handleDelete({})}>
                                                        删除
                                                    </Button>
                                                </Authorized>

                                                <Authorized authority={["1009"]}>
                                                    <Button style={{
                                                        position: 'absolute',
                                                        right: 15,
                                                        background: ' rgba(0, 31, 59, 1)',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }} onClick={() => this.handleAssign()}>
                                                        配置角色权限
                                                    </Button>
                                                </Authorized>
                                            </div>

                                            <Table
                                                rowKey={record => record.iId}
                                                loading={loading}
                                                dataSource={roleLists}
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
                        title='删除角色'
                        desc='是否删除该角色？'
                        topColor='red'
                        onCancel={this.modalCancel}
                        onConfirm={this.modalConfirm}
                    />

                    <Modal
                        title="新建角色"
                        visible={this.state.visible}
                        onOk={this.handleOk}
                        onCancel={this.handleCancel}
                    >
                        {this.renderNewRoleForm()}
                    </Modal>
                </PageHeaderWrapper>
            </div>
        )
    }
}

export default roleManage
