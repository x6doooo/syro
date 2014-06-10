SYRO
===
Real-Time System Monitor

[![NPM](https://nodei.co/npm/syro.png)](https://nodei.co/npm/syro/)

![DEMO](https://raw.githubusercontent.com/x6doooo/x6doooo.github.io/master/statics/imgs/syro-index.gif)

## 安装
	npm install syro -g

## 简介

* syro是一个服务器系统数据实时监控程序，目前可监控Mac和Linux系统。
* syro可以同时监测多台服务器(seeker)，同时需要一台中控服务器(dashboard)。
* 中控服务器负责收集监测数据，并为用户提供WEB服务，用户可通过WEB页面查看被监测服务器的实时系统数据。
* 监测为实时服务，默认不提供数据持久化功能。

## 使用方法

### 被监测服务器(seeker)

	1. syro init seeker
	2. syro start
	
### 中控服务器(dashboard)
	
	1. syro init dashboard
	2. syro start
    3. 用浏览器打开http://localhost:1337/

## 配置

    todo

