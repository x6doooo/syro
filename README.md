SYRO
===
Real-Time System Monitor

[![NPM](https://nodei.co/npm/syro.png)](https://nodei.co/npm/syro/)

![DEMO](https://raw.githubusercontent.com/x6doooo/x6doooo.github.io/master/statics/imgs/syro-index.gif)

## 安装
	npm install syro -g

## 使用

    1. syro可以同时监测多台服务器(seeker)，同时需要一台中控服务器(dashboard)。
    2. 中控服务器负责收集监测数据，并位用户提供WEB界面，查看被监测的服务器的实时系统数据。
    3. 监测为实时服务，默认不提供数据持久化功能。用户可以根据自己需要，自行采用数据库保存数据。


### 在被监测的机器上执行以下操作

	1. syro init seeker
	2. syro start
	
### 在中控服务器上执行以下操作
	
	1. syro init dashboard
	2. syro start
    3. visit http://localhost:1337/

## 配置

    todo

