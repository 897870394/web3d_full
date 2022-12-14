var _dec, _class;

const Component = require('../Component');
const TowerController = require('./TowerController');
const ENV_CLIENT = !(typeof window === 'undefined');

let TowerTrigger = (_dec = Component.serializedName("TowerTrigger"), _dec(_class = class TowerTrigger extends Component {

    constructor() {
        super();

        this.props.triggerType = 0;
    }

    start() {
        this.towerController = this.gameObject.scene.getObjectByName('TowerController').getComponent(TowerController);
    }

    onReceive(sender, ...args) {
        this[args[0]]();
    }

    onTriggerEnter() {
        if (ENV_CLIENT) {
            if (this.props.triggerType === 0) {
                TowerTrigger.getClientIntro().innerText = xorIntro;
                TowerTrigger.getClientIntro().style.display = 'block';
            }
        } else {
            // server
            if (this.towerController.simSteps.length > 0) return;
            switch (this.props.triggerType) {
                case 0:
                    this.towerController.simMoveStart();
                    break;
                default:
                    this.towerController.setPlateCount(this.props.triggerType);
                    break;
            }
        }
    }

    onTriggerExit() {
        if (ENV_CLIENT) {
            TowerTrigger.getClientIntro().style.display = 'none';
        }
    }

    static getClientIntro() {
        if (!TowerTrigger.clientIntro) {
            TowerTrigger.clientIntro = document.createElement('div');
            TowerTrigger.clientIntro.style.position = 'absolute';
            TowerTrigger.clientIntro.style.top = '10px';
            TowerTrigger.clientIntro.style.left = '10px';
            TowerTrigger.clientIntro.style.width = '200px';
            TowerTrigger.clientIntro.style.color = 'white';
            TowerTrigger.clientIntro.style.display = 'none';
            document.getElementById('gamePanel').appendChild(TowerTrigger.clientIntro);
        }
        return TowerTrigger.clientIntro;
    }
}) || _class);


module.exports = TowerTrigger;

const xorIntro = "???????????????\n" + "?????????????????????????????????????????????????????????????????????\n" + "\n" + "???????????????\n" + "??? n ???????????? A ?????? B???\n" + "1. ??? n-1 ???????????? A ?????? C\n" + "2. ???????????????????????? A ?????? B\n" + "3. ??? n-1 ???????????? C ?????? B";