const Player = {
    none: { color: 'gray' },
    slu: { color: 'green', name: 'SLU' },
    dac: { color: 'cyan', name: 'DAC' },
};
const nextTurn = (player) => player === Player.slu ? Player.dac : player === Player.dac ? Player.slu : undefined;
const Phase = {
    opening: 'opening',
    midgame: 'midgame',
    over: 'over',
};
const Facing = {
    west: {
        bridge: (x, y) => (x >= 1 && x <= 4) && (y >= 0 && y <= 4) ? (y << 2) + x - 1 : undefined
    },
    east: {
        bridge: (x, y) => (x >= 0 && x <= 3) && (y >= 0 && y <= 4) ? (y << 2) + x : undefined
    },
    south: {
        bridge: (x, y) => (x >= 0 && x <= 4) && (y >= 1 && y <= 4) ? (x << 2) + y + 19 : undefined
    },
    north: {
        bridge: (x, y) => (x >= 0 && x <= 4) && (y >= 0 && y <= 3) ? (x << 2) + y + 20 : undefined
    },
};
Facing.all = [Facing.west, Facing.east, Facing.south, Facing.north];
const openingBan = [
    false, false, false, false,
    true, true, true, true,
    false, false, false, false,
    true, true, true, true,
    false, false, false, false,

    false, false, false, false,
    true, true, true, true,
    false, false, false, false,
    true, true, true, true,
    false, false, false, false,
];
const nodes = (bridge) => bridge < 20 ? 
    [{ x: bridge & 3, y: bridge >> 2 }, { x: (bridge & 3) + 1, y: bridge >> 2 }] :
    [{ x: (bridge - 20) >> 2, y: bridge & 3 }, { x: (bridge - 20) >> 2, y: (bridge & 3) + 1 }];

const Cesoju = function() {
    this.init = function() {
        this.web = Array(40).fill(Player.none);
        this.turn = Player.slu;
        this.phase = Phase.opening;
        this.lock = {
            'SLU': false,
            'DAC': false,
        };
    }
    this.browse = function(x, y) {
        const result = {
            count: 0,
            owner: Player.none,
        }
        if (this.phase === Phase.opening) {
            if (x === 0 && y === 4) {
                result.owner = Player.slu;
            }
            if (x === 4 && y === 0) {
                result.owner = Player.dac;
            }
        }
        Facing.all.forEach((facing) => {
            const bridge = facing.bridge(x, y);
            if (bridge === undefined) {
                return result;
            }
            const owner = this.web[bridge];
            if (owner !== Player.none) {
                result.count++;
                result.owner = owner;
                result.bridge = bridge;
            }
        });
        return result;
    }
    this.estimate = function(bridge) {
        if (this.web[bridge] !== Player.none || 
            this.phase === Phase.opening && openingBan[bridge]) {
            return false;
        }
        const [a, b] = nodes(bridge).map((node) => this.browse(node.x, node.y));
        if (a.owner === this.turn && b.owner === this.turn) {
            return false;
        }
        if (a.owner === this.turn) {
            if (b.owner === nextTurn(this.turn)) {
                return !this.lock[nextTurn(this.turn).name] && b.count === 1;
            }
            return true;
        }
        if (b.owner === this.turn) {
            if (a.owner === nextTurn(this.turn)) {
                return !this.lock[nextTurn(this.turn).name] && a.count === 1;
            }
            return true;
        }
        return false;
    }
    this.build = function(bridge) {
        nodes(bridge).forEach((node) => {
            result = this.browse(node.x, node.y);
            if (result.owner !== this.turn) {
                this.web[bridge] = this.turn;
                if (result.owner === nextTurn(this.turn)) {
                    this.web[result.bridge] = Player.none;
                    this.phase = Phase.midgame;
                    this.lock[this.turn.name] = true;
                    if (this.estimate(result.bridge)) {
                        this.build(result.bridge);
                    }
                }
            }
        });
    }
    this.swap = function() {
        this.turn = nextTurn(this.turn);
        this.lock[this.turn.name] = false;
        if (this.web.find((_, i) => this.estimate(i)) === undefined) {
            this.phase = Phase.over;
        }
    }
    this.init();
}

const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
document.querySelectorAll('.cesoju').forEach((canvas) => {
    const context = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    let cesoju = new Cesoju();
    const draw = () => {
        context.reset();
        context.fillStyle = 'black';
        context.fillRect(0, 0, size, size);
        context.lineWidth = 4;
        for (let x = 0, y = 0, i = 0; i < 25; i++) {
            context.strokeStyle = cesoju.browse(x, y).owner.color;
            if (cesoju.phase == Phase.opening && (x === 1 || x === 3) && (y === 1 || y === 3)) {
                context.strokeStyle = 'red';
            }
            context.beginPath();
            context.arc(size * (0.2 * x + 0.1), size - size * (0.2 * y + 0.1), 0.01 * size, 0, 2 * Math.PI);
            context.stroke();
            if (++x >= 5) {
                x = 0;
                y++;
            }
        }
        for (let x = 0, y = 0, i = 0; i < 20; i++) {
            context.strokeStyle = cesoju.web[i].color;
            context.beginPath();
            context.moveTo(size * (0.2 * x + 0.11), size - size * (0.2 * y + 0.1));
            context.lineTo(size * (0.2 * x + 0.29), size - size * (0.2 * y + 0.1));
            context.stroke();
            if (++x >= 4) {
                x = 0;
                y++;
            }
        }
        for (let x = 0, y = 0, i = 20; i < 40; i++) {
            context.strokeStyle = cesoju.web[i].color;
            context.beginPath();
            context.moveTo(size * (0.2 * x + 0.1), size - size * (0.2 * y + 0.11));
            context.lineTo(size * (0.2 * x + 0.1), size - size * (0.2 * y + 0.29));
            context.stroke();
            if (++y >= 4) {
                y = 0;
                x++;
            }
        }
        if (cesoju.phase === Phase.over) {
            const winner = nextTurn(cesoju.turn);
            context.font = "bold 48px serif";
            context.fillStyle = winner.color;
            context.fillText(`${winner.name}`, 0.5 * size, 0.5 * size);
        } else {
            context.font = "16px serif";
            context.fillStyle = cesoju.turn.color;
            context.fillText(`${cesoju.turn.name}`, 0.5 * size, 0.5 * size);
        }
    }
    draw();

    let mouseX = 0;
    let mouseY = 0;
    const interpretCoords = () => {
        const x = 5 * mouseX / size;
        const y = 5.0 - 5 * mouseY / size;
        const ix = Math.trunc(x);
        const iy = Math.trunc(y);
        const dx = x - (ix + 0.5);
        const dy = y - (iy + 0.5);
        let facing = undefined;
        if (dx < 0 && dy < 0) {
            facing = -dx < -dy ? Facing.south : Facing.west;
        }
        if (dx >= 0 && dy < 0) {
            facing = dx < -dy ? Facing.south : Facing.east;
        }
        if (dx < 0 && dy >= 0) {
            facing = -dx < dy ? Facing.north : Facing.west;
        }
        if (dx >= 0 && dy >= 0) {
            facing = dx < dy ? Facing.north : Facing.east;
        }
        return facing.bridge(ix, iy);
    }
    canvas.addEventListener('mousemove', (e) => {
        mouseX = e.clientX - context.canvas.offsetLeft;
        mouseY = e.clientY - context.canvas.offsetTop;
        const bridge = interpretCoords();
        document.body.style.cursor = bridge !== undefined && cesoju.estimate(bridge) ? 'crosshair' : 'default';
    });
    canvas.addEventListener('mousedown', (e) => {
        if (cesoju.phase === Phase.over) {
            cesoju.init();
            draw();
            return;
        }
        const bridge = interpretCoords();
        if (bridge !== undefined && cesoju.estimate(interpretCoords())) {
            cesoju.build(bridge);
            cesoju.swap();
            draw();
        }
    });
});
