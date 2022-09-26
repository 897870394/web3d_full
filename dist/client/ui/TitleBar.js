const React = require('react');
const AppBar = require('material-ui/AppBar')['default'];
const Button = require("material-ui/FlatButton")['default'];
const Popover = require("material-ui/Popover")['default'];
const Menu = require("material-ui/Menu")['default'];
const MenuItem = require("material-ui/MenuItem")['default'];
const Client = require('../Client');

let TitleBar = class TitleBar extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return React.createElement(AppBar, {
            title: '教学平台',
            showMenuIconButton: false,
            iconElementRight: React.createElement(Info, { user: this.props.user, onLogout: this.props.onLogout, onLeaveRoom: this.props.onLeaveRoom })
        });
    }
};
let Info = class Info extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleLeaveRoom = this.handleLeaveRoom.bind(this);
    }
    handleClick(event) {
        event.preventDefault();
        this.setState({ open: true, anchorEl: event.currentTarget });
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleLeaveRoom() {
        this.handleClose();
        Client.current.leaveRoom(data => {
            this.props.onLeaveRoom(data);
        });
    }

    render() {
        const { anchorEl } = this.state;
        if (!this.props.user.login) return null;
        return React.createElement(
            'div',
            { style: { display: 'flex' } },
            React.createElement(
                'p',
                { style: { color: 'white', marginRight: '7px' } },
                'Hello,\xA0',
                this.props.user.username,
                '!'
            ),
            React.createElement(Button, {
                label: '选项',
                style: { color: 'white', marginTop: '7px' },
                onClick: this.handleClick }),
            React.createElement(
                Popover,
                {
                    open: this.state.open,
                    anchorEl: this.state.anchorEl
                    // anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                    // targetOrigin={{horizontal: 'left', vertical: 'top'}}
                    , onRequestClose: this.handleClose },
                React.createElement(
                    Menu,
                    null,
                    React.createElement(
                        MenuItem,
                        { onClick: this.handleLeaveRoom },
                        '\u9000\u51FA\u623F\u95F4'
                    )
                ),
                React.createElement(
                    Menu,
                    null,
                    React.createElement(
                        MenuItem,
                        { onClick: this.props.onLogout },
                        '\u767B\u51FA'
                    )
                )
            )
        );
    }
};


module.exports = TitleBar;