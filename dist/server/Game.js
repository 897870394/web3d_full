const BaseGame = require('../common/BaseGame');

let Game = class Game extends BaseGame {

    constructor() {
        super();

        /**
         * 我们希望同步所有客户端的时间间隔
         * @type {number}
         */
        this.syncTimeStep = 100;

        /**
         * 客户端同步循环方法
         * @type {Function}
         */
        this.syncMethod = undefined;

        /**
         * 上一次同步客户端的时间
         * @type {number}
         */
        this.lastSyncTime = 0;
    }

    start() {
        super.start();
        // this.raf = this.tick(() => {
        //     this.lastFrameTime = Date.now();
        //     // this.raf = this.tick(this.loop.bind(this));
        //     this.raf = setImmediate(this.loop.bind(this)(Date.now()));
        // });

        this.lastFrameTime = Date.now();
        // this.raf = this.tick(this.loop.bind(this));
        this.raf = setImmediate(() => {
            this.loop.bind(this);
            this.loop(Date.now());
        });
    }

    stop() {
        clearImmediate(this.raf);
        super.stop();
    }

    loop(timestamp) {
        this.raf = setImmediate(() => {
            this.loop.bind(this);
            this.loop(Date.now());
        });

        // 控制帧率，不让循环过快调用
        // fps+1 :否则因为太过接近，导致虽然调用都是 16ms，但一半被扔掉了
        if (timestamp < this.lastFrameTime + 1000 / (this.maxFPS + 1)) {
            return;
        }

        // 计算尚未被模拟的时间
        let frameTime = timestamp - this.lastFrameTime;
        this.delta += frameTime;
        this.lastFrameTime = timestamp;

        while (this.delta >= this.updateTimeStep) {
            // TODO BaseGame 的update 调用scene的update 最终执行每个obj的update
            this.update(this.updateTimeStep);
            this.delta -= this.updateTimeStep;
        }

        // sync all clients
        if (timestamp - this.lastSyncTime > this.syncTimeStep) {
            //console.log(this.scene.serverState);
            // TODO 这里发送服务器状态
            this.syncMethod(this.scene.serverState);
            this.lastSyncTime = timestamp;
        }

        if (frameTime > this.updateTimeStep * 2) {
            this.panic(frameTime);
        }
    }

    panic(frameTime) {}
    // console.warn("update costs too long(" + frameTime + "ms)!");


    // network
    onPlayerState(socket, state) {
        //console.log(socket.id, state);
        this.scene.clientState[socket.id] = state;
    }

};


module.exports = Game;