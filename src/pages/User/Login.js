import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-react/locale';
import { Checkbox, Alert, Icon } from 'antd';
import Login from '@/components/Login';
import styles from './Login.less';
import MD5 from 'crypto-js/md5'




const { Tab, UserName, Password, Mobile, Captcha, Submit } = Login;

@connect(({ login, loading }) => ({
  login,
  submitting: loading.effects['login/login'],
}))
class LoginPage extends Component {
  state = {
    type: 'account',
    autoLogin: true,
  };

  onTabChange = type => {
    this.setState({ type });
  };


  handleSubmit = (err, values) => {
    const { type } = this.state;
    const val={
      ...values,
      sPassWd:values.sPassWd !=="undefined"? MD5(values.sPassWd).toString():""
    }
    if (!err) {
      const { dispatch } = this.props;
      dispatch({
        type: "login/login",
        payload: {
          "svr_name": "CAD.OpUserMngSvr",
          "method_name": "UserLogin",
          "req_body": val
        }
      });
    }
  };

  changeAutoLogin = e => {
    this.setState({
      autoLogin: e.target.checked,
    });
  };

  renderMessage = content => (
    <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon />
  );

  render() {
    const { login, submitting } = this.props;
    const { type, autoLogin } = this.state;
    return (
      <div className={styles.main}>
        {/*<span>初始用户：</span><span>290876240@qq.com</span><br/>*/}
        <br/>
        {/*<span>初始密码：</span><span>123456</span>*/}

        <Login
          defaultActiveKey={type}
          onTabChange={this.onTabChange}
          onSubmit={this.handleSubmit}
          ref={form => {
            this.loginForm = form;
          }}
        >
            {login.status === 'error' &&
              login.type === 'account' &&
              !submitting &&
              this.renderMessage(formatMessage({ id: 'app.login.message-invalid-credentials' }))}
            <UserName
              name="sUserMail"
              placeholder='邮箱'
              rules={[
                {
                  required: true,
                  message: formatMessage({ id: 'validation.userName.required' }),
                },
              ]}

            />
            <Password
              name="sPassWd"
              placeholder='密码'
              rules={[
                {
                  required: true,
                  message: formatMessage({ id: 'validation.password.required' }),
                },
              ]}
              onPressEnter={e => {
                e.preventDefault();
                this.loginForm.validateFields(this.handleSubmit);
              }}
            />


          <div>
            <Checkbox checked={autoLogin} onChange={this.changeAutoLogin}>
              <FormattedMessage id="app.login.remember-me" />
            </Checkbox>
            {/*<a style={{ float: 'right' }} href="">*/}
            {/*  <FormattedMessage id="app.login.forgot-password" />*/}
            {/*</a>*/}
          </div>
          <Submit style={{border:"none"}} loading={submitting}>
            <FormattedMessage id="app.login.login" />
          </Submit>
          <div className={styles.other}>

          </div>
        </Login>
      </div>
    );
  }
}

export default LoginPage;
