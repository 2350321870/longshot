(function() {
    'use strict';

    class BaseEntity {
        constructor(x = 0, y = 0, radius = 10) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.vx = 0;
            this.vy = 0;
            this.active = true;
            this.angle = 0;
        }

        update(dt) {
            this.x += this.vx * dt * 60;
            this.y += this.vy * dt * 60;
        }

        render(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        getBounds() {
            return {
                x: this.x - this.radius,
                y: this.y - this.radius,
                width: this.radius * 2,
                height: this.radius * 2
            };
        }

        distanceTo(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        angleTo(other) {
            return Math.atan2(other.y - this.y, other.x - this.x);
        }

        collidesWith(other) {
            if (!other.radius) return false;
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < this.radius + other.radius;
        }

        destroy() {
            this.active = false;
        }
    }

    if (typeof window !== 'undefined') {
        window.BaseEntity = BaseEntity;
    }

})();
