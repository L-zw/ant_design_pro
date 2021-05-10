import React, {Fragment, Component} from 'react'
import PageHeaderWrapper from '@/components/PageHeaderWrapper'
import {
    Button,
    Card,
    Col,
    Table,
    Form,
    Row,
    message
} from "antd"
import {getUserToken} from '../../utils/authority'
import {setQueryPath} from "../../utils/storage"
import {getQueryPath} from '@/utils/storage'
import {connect} from "dva"
import styles from "./roleDetail.less"
import TipModal from '@/components/tipModal/index'
import router from 'umi/router'
import moment from 'moment'
import proImg from "../../assets/proImg.png"
import Authorized from '@/utils/Authorized'
import download from "@/utils/download/downloadExcel"

const FormItem = Form.Item
const formatDate = "YYYY-MM-DD"
const formatTime = "YYYY-MM-DD hh:mm:ss"
const getValue = obj =>
    Object.keys(obj)
        .map(key => obj[key])
        .join(',')
const statusMap = ['error', 'success']
const status = ['否', '是']
const {uid, token, roleId} = getUserToken()


@connect(({common, loading}) => ({
    common,
    loading: loading.models.common,
    // loading: loading.effects['deviceTest/fetch'],
}))
@Form.create(
    {}
)
class roleDetail extends Component {
    constructor(props) {
        super(props)
    }

    state = {
        role: {},
        iPageIndex: 1,
        iPageSize: 10,
        userList: [],
        selectedRows: [],
        selectedRowKeys: [],
        modalVisible: false,
        totalCot: 0,
        record: {},
        title: '删除角色',
        desc: '是否删除该角色',
        topColor: 'red',
        del: 1, // 1表示当前操作是删除角色，2表示移除
    }

    columns = [
        {
            title: '用户ID',
            dataIndex: 'iUid',
        },
        {
            title: '姓名',
            dataIndex: 'sName',
        },
        {
            title: '角色',
            dataIndex: 'sRoleName',
        },
        {
            title: '联系方式',
            dataIndex: 'sPhone',
        },
        {
            title: '操作',
            dataIndex: 'operation',
            render: (text, record) => {
                return [
                    <Fragment key={record.iUid}>
                        <Authorized authority={["1008"]}>
                            <a onClick={() => {this.deleteUser(record)}}>移除</a>
                        </Authorized>
                    </Fragment>
                ]
            }
        }
    ]

    componentDidMount() {
        const takeQueryPaths = getQueryPath()
        const pathName = this.props.location.pathname
        let query = {}
        if (Object.keys(takeQueryPaths).includes(pathName)) {
            query = takeQueryPaths[pathName]
        }
        let newRole = JSON.parse(query.role)
        this.setState({
            role: newRole
        })
        let params = {
            iUid: uid,
            sToken: token,
            iPageIndex: 1,
            iPageSize: 10,
            oCond: {
                iRoleId: newRole.iId
            }
        }
        this.getRoleInfo(params)
    }


    /*
    * 接口
    * */
    // 拉取角色信息
    getRoleInfo = (params) => {
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
                        this.setState({
                            userList: respBody.listUser,
                            totalCot: respBody.iCount
                        })
                    } else {
                        message.error("拉取角色信息失败！")
                    }
                } else {
                    message.error('服务器出错了')
                }
            } catch (e) {
                console.log("e", e)
            }
        })
    }

    // 移除用户
    moveUser = (params) => {
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
                        message.success("移除成功！")
                        const {role} = this.state
                        let params = {
                            iUid: uid,
                            sToken: token,
                            iPageIndex: 1,
                            iPageSize: 10,
                            oCond: {
                                iRoleId: role.iId
                            }
                        }
                        this.getRoleInfo(params)
                    } else {
                        message.error("移除失败！")
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
    // 打开删除角色弹窗
    deleteRole = () => {
        if (this.state.totalCot > 0) {
            message.error('该角色下已有用户')
            return
        }
        this.setState({
            modalVisible: true,
            title: '删除角色',
            desc: '是否删除该角色',
            topColor: 'red',
            del: 1
        })
    }

    // 导出excel
    downloadExl = () => {
        let rawData = this.state.selectedRows
        if (rawData.length === 0) {
            message.error("请选择要导出的数据")
            return
        }

        // let datas = _.clone(results)//这里为了不影响项目的数据的使用 采用了lodash中的深克隆方法
        let datas = rawData

        let json = datas.map(item => { //将json数据的键名更换成导出时需要的键名
            return {
                '用户ID': item.iUid,
                '姓名': item.sName,
                '角色': item.sRoleName,
                '联系方式': item.sPhone,
            }
        })
        download(json, '用户管理信息.xlsx')//导出的文件名
    }

    //
    deleteUser = (record) => {
        console.log(record)
        let rows = []
        const arr = Object.keys(record)

        //  为避免出错以下代码不做修改
        if (arr.length > 0) {
            rows.push(record)
        } else {
            this.state.selectedRows.map((item) => {
                rows.push(item)
            })
        }
        if (rows.length === 0) {
            message.error('请选择操作的数据')
            return
        }
        this.setState({
            modalVisible: true,
            title: '移除用户',
            desc: '是否移除该用户',
            topColor: 'red',
            del: 2,
            record,
        })
    }

    //
    modalConfirm = () => {
        const {dispatch} = this.props
        const {record, del} = this.state
        if (del === 1) {
            // 删除角色
            dispatch({
                type: 'common/update',
                payload: {
                    "svr_name": "YSSQ.WebRoleAuthSvr",
                    "method_name": "DeleteRole",
                    "req_body": {
                        iUid: uid,
                        sToken: token,
                        listRoleId: [this.state.role.iId]
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
                            const path = '/auth/role-manage'
                            router.push({
                                pathname: path,
                            })
                        } else {
                            message.error('删除失败！')
                        }
                    }
                } catch (e) {
                    console.log("e", e)
                }
            })
        }
        if (del === 2) {
            // 移除用户
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
                let params = {
                    iUid: uid,
                    sToken: token,
                    iAssignRoleId: 0,
                    listUid
                }
                this.moveUser(params)
            }
        }

        // 重置record
        this.setState({
            modalVisible: false,
            record: {}
        })
    }

    // 移除用户弹窗 取消
    modalCancel = () => {
        this.setState({
            modalVisible: false,
            record: {}
        })
    }

    //  分页改变
    handleStandardTableChange = (pagination, filtersArg, sorter) => {
        const params = {
            iPageIndex: pagination.current,
            iPageSize: pagination.pageSize,
            iUid: uid,
            sToken: token,
            iRoleId: this.state.role.iId,
            iLoginRoleId: roleId,
        }
        this.getRoleInfo(params)
        this.setState({
            iPageIndex: pagination.current,
            iPageSize: pagination.pageSize,
        })
    }


    /*
    * 渲染
    * */
    renderRoleInfo = () => {
        const {role, totalCot} = this.state
        return (
            <Fragment>
                <div style={{float: 'left', width: '70%', marginLeft: 10}}>
                    <h2>
                        <span>
                            <img style={{width: 24, height: 24, marginRight: 10, marginTop: -5}} src={proImg}alt="图标"/></span>
                        <span>{role.sName}</span>
                    </h2>
                    <div style={{display: 'inline-block', margin: '10px 0 10px 35px', fontSize: 16}}>
                        <span>用户数量：</span>
                        <span>{totalCot}</span>
                    </div>
                </div>
                <div style={{float: 'right'}}>
                    <div style={{display: 'inline-block', marginRight: 30}}>
                        <Authorized authority={["1006"]}>
                            <Button onClick={() => this.deleteRole()}>删除角色</Button>
                        </Authorized>
                    </div>
                    <div style={{display: 'inline-block'}}>
                        <Button onClick={router.goBack}>返回</Button>
                    </div>
                </div>
            </Fragment>
        )
    }

    // 组件渲染
    render() {
        const {loading} = this.props
        const {selectedRows, selectedRowKeys, userList, totalCot, modalVisible, role, title, desc, topColor} = this.state
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
            total: totalCot,
            showTotal: () => {return `共${this.state.totalCot}条记录`},
            showQuickJumper: true,
            showSizeChanger: true,
        }

        return (
            <div className={styles.roleDetail}>
                <PageHeaderWrapper>
                    <div>
                        <Row>
                            <Col span={24}>
                                <div className={styles.cardList} style={{width: "100%", paddingTop: "-24px"}}>
                                    <div>
                                        <Card title="角色详情" bordered={false}
                                              style={{width: "100%"}}>
                                            <div>
                                                {this.renderRoleInfo()}
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <div style={{padding: "24px"}}>
                                    <Card bordered={false}>
                                        <div className={styles.tableList}>
                                            <div className={styles.tableListOperator}>
                                                <Authorized authority={["1010"]}>
                                                    <Button style={{marginLeft: 8}} icon="vertical-align-bottom" onClick={() => this.downloadExl(true)}>
                                                        导出
                                                    </Button>
                                                </Authorized>
                                                <Authorized authority={["1008"]}>
                                                    <Button icon="logout" onClick={() => this.deleteUser({})}>
                                                        移除
                                                    </Button>
                                                </Authorized>
                                            </div>

                                            <Table
                                                rowKey={record => record.iUid}
                                                loading={loading}
                                                dataSource={userList}
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
            </div>
        )
    }
}

export default roleDetail
