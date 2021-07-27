var ScreenWidth: number = 1960;
var ScreenHeight: number = 1080;
var FarClippingPlane: number = 50;
const Clamp = (value: number, min:number, max: number) => Math.min(Math.max(value, min), max);
const HalfSizeX: number = 10;
const HalfSizeY:number = 5;
const Margin = 150;

class vec3 {
    x: number;
    y: number;
    z: number;

    static Zero = new vec3(0, 0, 0);

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    Add(other : any): vec3 {
        if (other instanceof vec3) 
            return new vec3(this.x + other.x, this.y + other.y, this.z + other.z);
        if (typeof(other) == "number")
            return new vec3(this.x + other, this.y + other, this.z + other);
        return new vec3(this.x, this.y, this.z);
    }

    Substract(other: any): vec3 {
        if (other instanceof vec3)
            return new vec3(this.x - other.x, this.y - other.y, this.z - other.z);
        
        if (typeof(other) == "number")
            return new vec3(this.x - other, this.y - other, this.z - other);
        return new vec3(this.x, this.y, this.z);
    }

    Dot(other: vec3): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    Cross(other: vec3): vec3 {
        return new vec3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
    }

    Times(coefficient: number): vec3 {
        return new vec3(this.x * coefficient, this.y * coefficient, this.z * coefficient);
    }

    SquareDistance(other: vec3): number {
        return (this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y) + (this.z - other.z) * (this.z - other.z);
    };

    Distance(other: vec3): number {
        return Math.sqrt(this.SquareDistance(other));
    }

    SquareMagnitude(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    Magnitude():number {
        return Math.sqrt(this.SquareMagnitude());
    }
}

class Boid {
    Position: vec3;
    Velocity: vec3;

    IsPerching: boolean;

    constructor(position: vec3, velocity?: vec3, isPerching?: boolean) {
        this.Position = position;
        if (velocity) this.Velocity = velocity;
        else this.Velocity = vec3.Zero;
        if (isPerching) this.IsPerching = isPerching;
        else this.IsPerching = false; 
    }
}

class BoidBehavior {
    boidNum: number;
    boids: Array<Boid>;
    separationDistance: number; // square distance
    separationFactor: number;

    cohesionDistance: number; // square distance
    cohesionFactor: number;

    alignmentFactor: number;

    SpeedLimit: number;
    SpeedConvergenceFactor: number;

    TurnFactor: number = 0.75;

    constructor(boidNum: number, separationDistance: number, separationFactor: number, cohesionDistance: number, cohesionFactor: number, alignmentFactor: number, speedLimit: number, speedConvergenceFactor: number) {
        this.boidNum = boidNum;
        this.separationDistance = separationDistance;
        this.separationFactor = separationFactor;
        this.cohesionDistance = cohesionDistance;
        this.cohesionFactor = cohesionFactor;
        this.alignmentFactor = alignmentFactor;
        this.SpeedLimit = speedLimit;
        this.SpeedConvergenceFactor = speedConvergenceFactor;

        this.boids = new Array<Boid>();
    }

    InitBoids() {
        let currentCount = this.boids.length;
        if (this.boidNum >= currentCount) {
            for (let i = currentCount; i < this.boidNum; i++) {
                let pos: vec3 = new vec3(0, 0, 0);
                let vel: vec3 = new vec3(0, 0 ,0);
                pos.x = Math.random() * (ScreenWidth - 2 * Margin) + Margin;
                pos.y = Math.random() * (ScreenHeight - 2 * Margin) + Margin;
                // pos.z = Math.random() * FarClippingPlane;
                vel = this.RandomVelocity();
                this.boids.push(new Boid(pos, vel, false));
            }
        } else {
            for (let i = currentCount; i >= this.boidNum; i--)
                this.boids.pop();
        }
    }

    RandomVelocity(yNegative: boolean = false): vec3 {
        let vel: vec3 = new vec3(0, 0 ,0);
        vel.x = (1 - 2 * Math.random()) * this.SpeedLimit;
        if (yNegative) {
            vel.y = - Math.random() * this.SpeedLimit;
        } else {
            vel.y = (1 - 2 * Math.random()) * this.SpeedLimit;
        }
        // vel.z = Math.random() * this.SpeedLimit;
        return vel;
    }

    UpdateBoids(deltaTime: number) {
        for (const aBoid of this.boids) {
            this.Separation(aBoid);
            this.Cohesion(aBoid);
            this.Alignment(aBoid);
            this.LimitSpeed(aBoid);
            this.LimitWithinScreen(aBoid);
            this.RandomPerch(aBoid);

            this.UpdatePosition(deltaTime, aBoid);
        }
    }

    Draw(context: CanvasRenderingContext2D) {
        context.clearRect(0, 0, ScreenWidth, ScreenHeight);
        let angle: number;
        for (const aBoid of this.boids) {
            angle = Math.atan2(aBoid.Velocity.y, aBoid.Velocity.x);
            context.translate(aBoid.Position.x, aBoid.Position.y);
            context.rotate(angle);
            context.translate(-aBoid.Position.x, -aBoid.Position.y);
            context.fillStyle = "#008800";
            
            context.beginPath();
            context.moveTo(aBoid.Position.x, aBoid.Position.y);
            context.lineTo(aBoid.Position.x - HalfSizeX, aBoid.Position.y + HalfSizeY);
            context.lineTo(aBoid.Position.x - HalfSizeX, aBoid.Position.y - HalfSizeY);
            context.lineTo(aBoid.Position.x, aBoid.Position.y);
            context.fill();
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.stroke();
        }
    }

    Separation(boid: Boid) {
        let displacement: vec3 = vec3.Zero;
        // let num: number = 0;

        for (const aBoid of this.boids) {
            if (aBoid === boid || aBoid.IsPerching) continue;
            
            if (boid.Position.SquareDistance(aBoid.Position) <= this.separationDistance) {
                displacement = displacement.Add(boid.Position.Substract(aBoid.Position));
                // num++;
            }
        }
        // if (num > 0)
        //     displacement = displacement.Times(1.0 / num);
        displacement = displacement.Times(this.separationFactor);
        boid.Velocity = boid.Velocity.Add(displacement);
    }

    Cohesion(boid: Boid) {
        let center: vec3 = vec3.Zero;
        let num: number = 0;

        for (const aBoid of this.boids) {
            if (aBoid === boid || aBoid.IsPerching) continue;
            
            if (boid.Position.SquareDistance(aBoid.Position) <= this.cohesionDistance) {
                center = center.Add(aBoid.Position);
                num++;
            }
        }
        
        if (num > 0) {
            center = center.Times(1.0 / num);
        let displacement: vec3 = center.Substract(boid.Position).Times(this.cohesionFactor);
        boid.Velocity = boid.Velocity.Add(displacement);
        }
    }

    /* Match velocity */
    Alignment(boid: Boid) {
        let vel: vec3 = vec3.Zero;
        let num: number = 0;

        for (const aBoid of this.boids) {
            if (aBoid == boid || aBoid.IsPerching) continue;

            if (boid.Position.SquareDistance(aBoid.Position) <= this.cohesionDistance) {
                vel = vel.Add(aBoid.Velocity);
                num++;
            }
        }

        if (num > 0) {
            vel = vel.Times(1.0 / num); // average velocity
        vel = vel.Substract(boid.Velocity).Times(this.alignmentFactor);
        boid.Velocity = boid.Velocity.Add(vel);
        }
    }

    LimitSpeed(boid: Boid) {
        if (boid.IsPerching || this.SpeedLimit == 0) {
            boid.Velocity = vec3.Zero;
            return;
        }
        let overSpeedRatio = boid.Velocity.Magnitude() / this.SpeedLimit;
        if (overSpeedRatio > 1.0) {
            boid.Velocity = boid.Velocity.Times(this.SpeedConvergenceFactor);
        }
    }

    LimitWithinScreen(boid: Boid) {
        if (boid.IsPerching) return;
        if (boid.Position.x >= ScreenWidth - Margin) {
            boid.Velocity.x -= this.SpeedLimit * this.TurnFactor; /*Clamp(boid.Velocity.x, boid.Velocity.x, 0)*/;
        } else if (boid.Position.x <= Margin) {
            boid.Velocity.x += this.SpeedLimit * this.TurnFactor/*Clamp(boid.Velocity.x, 0, boid.Velocity.x)*/;
        }

        if (boid.Position.y >= ScreenHeight - Margin) {
            boid.Velocity.y -= this.SpeedLimit * this.TurnFactor/*Clamp(boid.Velocity.y, boid.Velocity.y, 0)*/;
        } else if (boid.Position.y <= Margin) {
            boid.Velocity.y += this.SpeedLimit * this.TurnFactor/*Clamp(boid.Velocity.y, 0, boid.Velocity.y)*/;
        }
    }

    RandomPerch(boid: Boid) {
        if (!boid.IsPerching && boid.Position.y < ScreenHeight - Margin) return;
        let probability = 0.5;
        if (boid.IsPerching)
            probability = 0.9;
        let isPerching = Math.random() <= probability;
        boid.IsPerching = isPerching;
        if (isPerching)
            boid.Velocity = vec3.Zero;
        else if (boid.Velocity == vec3.Zero)
            boid.Velocity = this.RandomVelocity(true); // assign random velocity
    }

    UpdatePosition(deltaTime: number, boid: Boid) {
        boid.Position = boid.Position.Add(boid.Velocity.Times(deltaTime / 1000.0));
        // console.log("Boid Vel " + boid.Velocity.x + ", " + boid.Velocity.y);
    }
}

class MainAPP {
    Canvas: HTMLCanvasElement;
    Context: CanvasRenderingContext2D;
    BoidBehavior: BoidBehavior;

    resizeCanvas() {
        if (this.Canvas != null) {
            ScreenWidth = window.innerWidth;
            ScreenHeight = window.innerHeight;
            this.Canvas.width = ScreenWidth;
            this.Canvas.height = ScreenHeight;
        }
    }

    Start(window: Window) {
        this.BoidBehavior = new BoidBehavior(120, 400, 0.9, 4900, 0.15, 0.05, 300, 0.4);
        this.BoidBehavior.InitBoids();

        this.Canvas = document.getElementById("boids") as HTMLCanvasElement;
        if (this.Canvas != null)
            this.Context = this.Canvas.getContext("2d");

        new SliderInput("boidNum", this.BoidBehavior);
        new SliderInput("separationDistance", this.BoidBehavior);
        new SliderInput("separationFactor", this.BoidBehavior);
        new SliderInput("cohesionDistance", this.BoidBehavior);
        new SliderInput("cohesionFactor", this.BoidBehavior);
        new SliderInput("alignmentFactor", this.BoidBehavior);
        new SliderInput("speedLimit", this.BoidBehavior);
        new SliderInput("speedConvergenceFactor", this.BoidBehavior);
    }

    Update(deltaTime: number) {
        this.BoidBehavior.UpdateBoids(deltaTime);
        this.BoidBehavior.Draw(this.Context);
    }
}

class SliderInput {
    slider: HTMLInputElement
    boidBehavior: BoidBehavior;

    constructor(id: string, boidBehavior: BoidBehavior) {
        let slider = document.getElementById(id) as HTMLInputElement;
        this.slider = slider;
        this.boidBehavior = boidBehavior;
        this.slider.onchange = ()=> {
            if (boidBehavior == null) return;

            let value = Number(slider.value);
            switch(slider.id) {
                case "boidNum":
                    value = value * 3;
                    boidBehavior.boidNum = value;
                    boidBehavior.InitBoids();
                    break;
                case "separationDistance":
                    value = Math.pow(value, 2);
                    boidBehavior.separationDistance = value;
                    break;
                case "separationFactor":
                    value /= 100.0;
                    boidBehavior.separationFactor = value;
                    break;
                case "cohesionDistance":
                    value = Math.pow(value * 5, 2);
                    boidBehavior.cohesionDistance = value;
                    break;
                case "cohesionFactor":
                    value /= 100.0;
                    boidBehavior.cohesionFactor = value;
                    break;
                case "alignmentFactor":
                    value /= 100.0;
                    boidBehavior.alignmentFactor = value;
                    break;
                case "speedLimit":
                    value = value * 5;
                    boidBehavior.SpeedLimit = value;
                    break;
                case "SpeedConvergenceFactor":
                    value /= 100.0;
                    boidBehavior.SpeedConvergenceFactor = value;
                    break;
            }

            // console.log("Value Changed - " + slider.id + " = " + value);
        };

    }
}

var mainApp: MainAPP = new MainAPP();
window.onload = () => {
    window.addEventListener("resize", mainApp.resizeCanvas, false);
    lastUpdateTimeStamp = performance.now();

    mainApp.Start(window);
    mainApp.resizeCanvas();
    window.requestAnimationFrame(FixedUpdate);
};

var FixedFrameRate: number = 60;
var lastUpdateTimeStamp: number; // in milleseconds

function FixedUpdate(timestamp: number) {
    if (timestamp - lastUpdateTimeStamp >= 1000 / FixedFrameRate) {
        let deltaTime = timestamp - lastUpdateTimeStamp;
        lastUpdateTimeStamp = timestamp;

        mainApp.Update(deltaTime);
    }

    window.requestAnimationFrame(FixedUpdate);
}