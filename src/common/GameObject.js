const ENV_CLIENT = !(typeof window === 'undefined');

class GameObject {

    constructor(obj3d) {

        Object.defineProperty(this, "_obj3d", {
            value: obj3d
        });

        Object.defineProperty(obj3d, "_gameObject", {
            value: this
        });

        Object.defineProperty(this, "children", {
            get: () => this._obj3d.children.map((o) => o._gameObject)
        });

        // server-client 保存对方的状态
        Object.defineProperty(this, "peerState", {
            get: () => this.scene[ENV_CLIENT? 'serverState' : 'clientState'][this.networkId],
            set: (value) => this.scene[ENV_CLIENT? 'serverState' : 'clientState'][this.networkId] = value
        });

        Object.defineProperty(this, "serverState", {
            get: () => this.scene['serverState'][this.networkId],
            set: (value) => this.scene['serverState'][this.networkId] = value
        });

        /**
         * 游戏物体所在的场景
         * @type {Scene}
         */
        this.scene = null;

        /**
         * 游戏的网络 id
         * 如果是需要多人同步的物体，由服务端生成
         * @type {String}
         */
        this.networkId = null;

        /**
         * 所有组件
         * @type {Map<Function, Array<Component>>}
         * @private
         */
        this.components = new Map();

        /**
         * 需要更新的组件列表
         * @type {Array}
         * @private
         */
        this.componentsNeedUpdate = [];

        return this.new(this);
    }

    /**
     * add component to game object
     * @param component
     */
    addComponent(component) {
        //console.log(component.class);
        if (!ENV_CLIENT && component.class.isClientOnly) return;
        // TODO 缓存?
        let exists = this.components.get(component.class);
        if (exists) {
            exists.push(component);
        } else {
            this.components.set(component.class, [component]);
        }
        // TODO 应该是初始定义undefined
        if (typeof component.update === 'function') {
            this.componentsNeedUpdate.push(component);
        }
        // TODO 把gameObject的引用传给组件
        component.gameObject = this;
        // 添加组件时已经在场景中？那么补充调用组件的 onstart
        if (this.scene && typeof component.start === 'function') {
            // TODO 组件start()
            component.start();
        }
    }

    /**
     * remove component of game object
     * @param component
     */
    removeComponent(component) {
        // 删除组件时仍然在场景中？那么补充调用组件的 ondestroy
        if (this.scene && typeof component.destroy === 'function') {
            component.destroy();
        }

        let exists = this.components.get(component.class);
        if (exists) {
            exists.remove(component);
        }
        this.componentsNeedUpdate.remove(component);
        component.gameObject = null;
    }

    /**
     * get component of certain class
     * @param klass class of component
     * @returns {Component | null}
     */
    getComponent(klass) {
        let exists = this.components.get(klass);
        return exists ? exists[0] : null;
    }

    /**
     * get all components of certain class
     * @param klass class of component
     * @returns {Array<Component> | undefined}
     */
    getComponents(klass) {
        return this.components.get(klass);
    }

    /**
     * broadcast message to all components
     * @param sender
     * @param args
     */
    broadcast(sender, ...args) {
        this.components.forEach(value => {
            for (let i of value) {
                i.onReceive(sender, ...args);
            }
        });
    }

    /**
     * fully proxy THREE.Object3D
     * @returns {Object}
     * @param origin
     * @private
     */
    new(origin) {
        const handler = {
            get: function(target, property) {
                return (property in target) ? target[property] : target._obj3d[property];
            },
            set: function(target, property, value) {
                if (property in target) {
                    target[property] = value;
                } else {
                    target._obj3d[property] = value;
                }
                return true;
            },
            has: function(target, key) {
                return key in target || key in target._obj3d;
            }
        };
        //console.log(this);
        //let origin = new GameObject(...constructor_args);
        let proxy = new Proxy(origin, handler);
        proxy._origin = origin;
        //proxy.class = GameObject;
        return proxy;
    }

    /**
     * 物体被加入到场景中时回调
     */
    onAddToScene(scene) {
        this.scene = scene;
        // 子物体递归调用 onstart
        // console.log(this._obj3d.children);
        // console.log(this.name, this.children, this._obj3d.children);
        for (let child of this.children) {
            if (!child) continue;
            child.onAddToScene(scene);
        }
        // 保存相机用于渲染
        if (this._obj3d.isCamera) {
            console.log(this._obj3d.name, 'set camera');
            scene._camera = this._obj3d;
        }
    }

    /**
     * 物体被加入到场景后回调
     */
    onStart() {
        // TODO 自身组件的子组件
        // 自身组件 onstart
        this.components.forEach(value => {
            for (let i of value) {
                if (typeof i.start === 'function') {
                    i.start();
                }
            }
        });
        // TODO 在这里执行Client的子物体调用onstart()
        // 子物体递归调用 onstart
        //console.log(this._obj3d.children);
        //console.log(this.name, this.children, this._obj3d.children);
        for (let child of this.children) {
            if (!child) continue;
            child.onStart();
        }
    }

    onRemove() {
        // 自身组件 destroy
        this.components.forEach(value => {
            for (let i of value) {
                if (typeof i.destroy === 'function') {
                    i.destroy();
                }
            }
        });
        // 子物体递归调用 onremove
        for (let child of this.children) {
            if (!child) continue;
            child.onRemove();
        }

        this.scene = null;
    }

    /**
     * on game update
     * @param deltaTime
     * @private
     */
    update(deltaTime) {
        for (let comp of this.componentsNeedUpdate) {
            comp.update(deltaTime);
        }
    }

    add(...gameObjects) {
        // console.log("GameObject add() this.scene is null ?" + this.scene);
        this._obj3d.add(...gameObjects.map((o) => o._obj3d));
        // 已经在场景中，补充调用 onstart
        if (this.scene) {
            gameObjects.forEach((obj) => obj.onAddToScene(this.scene));
            gameObjects.forEach((obj) => obj.onStart());
        }
    }

    remove(...gameObjects) {
        // 仍然在场景中，补充调用 onremove
        if (this.scene) {
            gameObjects.forEach((obj) => obj.onRemove());
        }
        this._obj3d.remove(...gameObjects.map((o) => o._obj3d));
    }

    clone() {
        let newObj3d = this._obj3d.clone();
        let ret = new GameObject(newObj3d);
        this.components.forEach(value => {
            for (let i of value) {
                let comp = new i.class();
                comp.props = JSON.parse(JSON.stringify(i.props));
                ret.addComponent(comp);
            }
        });
        //console.log(ret);
        return ret;
    }
}

module.exports = GameObject;