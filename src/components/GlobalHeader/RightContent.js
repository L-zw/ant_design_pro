import React, { PureComponent } from 'react';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import { Spin, Tag, Menu, Icon, Avatar, Tooltip, message } from 'antd';
import moment from 'moment';
import groupBy from 'lodash/groupBy';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';
import router from 'umi/router';
import avatar from '@/assets/avatar/avatar.png'

export default class GlobalHeaderRight extends PureComponent {
  getNoticeData() {
    const { notices = [] } = this.props;
    if (notices.length === 0) {
      return {};
    }
    const newNotices = notices.map(notice => {
      const newNotice = { ...notice };
      if (newNotice.datetime) {
        newNotice.datetime = moment(notice.datetime).fromNow();
      }
      if (newNotice.id) {
        newNotice.key = newNotice.id;
      }
      if (newNotice.extra && newNotice.status) {
        const color = {
          todo: '',
          processing: 'blue',
          urgent: 'red',
          doing: 'gold',
        }[newNotice.status];
        newNotice.extra = (
          <Tag color={color} style={{ marginRight: 0 }}>
            {newNotice.extra}
          </Tag>
        );
      }
      return newNotice;
    });
    return groupBy(newNotices, 'type');
  }

  getUnreadData = noticeData => {
    const unreadMsg = {};
    Object.entries(noticeData).forEach(([key, value]) => {
      if (!unreadMsg[key]) {
        unreadMsg[key] = 0;
      }
      if (Array.isArray(value)) {
        unreadMsg[key] = value.filter(item => !item.read).length;
      }
    });
    return unreadMsg;
  };

  changeReadState = clickedItem => {
    const { id } = clickedItem;
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeNoticeReadState',
      payload: id,
    });
  };

  jumpToUserCenter=()=>{
    router.push("/user-center")
  }

  handleLogout=()=>{
    const { dispatch } = this.props;
    dispatch({
      type:"login/logout"
    })
  }

  render() {
    const {
      currentUser,
      theme,
    } = this.props;
    const menu = (
        <Menu className={styles.menu} selectedKeys={[]} >
          <Menu.Item key="userCenter" onClick={()=>this.jumpToUserCenter()}>
            <Icon type="user" />
            个人中心
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item key="logout"  onClick={()=>this.handleLogout()}>
            <Icon type="logout" />
            <FormattedMessage id="menu.account.logout" defaultMessage="logout" />
          </Menu.Item>
        </Menu>
    );
    const noticeData = this.getNoticeData();
    const unreadMsg = this.getUnreadData(noticeData);
    let className = styles.right;
    if (theme === 'dark') {
      className = `${styles.right}  ${styles.dark}`;
    }
    return (
      <div className={className}>
        {currentUser.name ? (
            <HeaderDropdown overlay={menu}>
            <span className={`${styles.action} ${styles.account}`}>
              <Avatar
                  size="small"
                  className={styles.avatar}
                  src={currentUser.avatar?currentUser.avatar:avatar}
                  alt="avatar"
              />
              <span className={styles.name}>{currentUser.name}</span>
            </span>
            </HeaderDropdown>
        ) : (
            <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
        )}
      </div>
    );
  }
}
