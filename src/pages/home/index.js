
import React, {Component, Fragment} from 'react'
import {Card} from 'antd';
import styles from './index.less'
import PageHeaderWrapper from '@/components/PageHeaderWrapper';


export default class Index extends Component {
    static defaultProps = {}
    state = {
    };

    render() {
        return(

            <PageHeaderWrapper
                title={"首页"}
                content=""
            >
                <Card bordered={false}
                      className={styles.outerCard}
                >
                    <div>
                        <h2 className={styles.title}>Ant Design！</h2>
                    </div>

                </Card>

            </PageHeaderWrapper>
        )
    }
}
