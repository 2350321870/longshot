(function() {
    'use strict';

    class CollisionSystem extends BaseSystem {
        constructor() {
            super();
            this.collisionPairs = [];
            this.handlers = new Map();
        }

        setGame(game) {
            super.setGame(game);
        }

        registerHandler(type1, type2, handler) {
            const key = `${type1}:${type2}`;
            if (!this.handlers.has(key)) {
                this.handlers.set(key, []);
            }
            this.handlers.get(key).push(handler);
        }

        checkCollision(obj1, obj2) {
            if (!obj1 || !obj2) return false;
            
            if (obj1.radius !== undefined && obj2.radius !== undefined) {
                return this.checkCircleCollision(obj1, obj2);
            }
            
            return this.checkAABBCollision(obj1, obj2);
        }

        checkCircleCollision(circle1, circle2) {
            if (!circle1 || !circle2) return false;
            
            const dx = circle2.x - circle1.x;
            const dy = circle2.y - circle1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = circle1.radius + circle2.radius;
            
            return distance < minDist;
        }

        checkAABBCollision(rect1, rect2) {
            if (!rect1 || !rect2) return false;
            
            const r1 = this.getAABB(rect1);
            const r2 = this.getAABB(rect2);
            
            return r1.x < r2.x + r2.width &&
                   r1.x + r1.width > r2.x &&
                   r1.y < r2.y + r2.height &&
                   r1.y + r1.height > r2.y;
        }

        getAABB(obj) {
            if (obj.x === undefined || obj.y === undefined) {
                return { x: 0, y: 0, width: 0, height: 0 };
            }
            
            if (obj.radius !== undefined) {
                return {
                    x: obj.x - obj.radius,
                    y: obj.y - obj.radius,
                    width: obj.radius * 2,
                    height: obj.radius * 2
                };
            }
            
            return {
                x: obj.x,
                y: obj.y,
                width: obj.width || 0,
                height: obj.height || 0
            };
        }

        checkCircleRectCollision(circle, rect) {
            if (!circle || !rect) return false;
            
            const r = this.getAABB(rect);
            const closestX = Math.max(r.x, Math.min(circle.x, r.x + r.width));
            const closestY = Math.max(r.y, Math.min(circle.y, r.y + r.height));
            
            const dx = circle.x - closestX;
            const dy = circle.y - closestY;
            
            return (dx * dx + dy * dy) < (circle.radius * circle.radius);
        }

        checkLineCircleCollision(startX, startY, endX, endY, circle, radius) {
            const dx = endX - startX;
            const dy = endY - startY;
            const fx = startX - circle.x;
            const fy = startY - circle.y;
            
            const a = dx * dx + dy * dy;
            const b = 2 * (fx * dx + fy * dy);
            const c = fx * fx + fy * fy - radius * radius;
            
            let discriminant = b * b - 4 * a * c;
            if (discriminant < 0) return false;
            
            discriminant = Math.sqrt(discriminant);
            const t1 = (-b - discriminant) / (2 * a);
            const t2 = (-b + discriminant) / (2 * a);
            
            return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
        }

        getDistance(obj1, obj2) {
            if (!obj1 || !obj2) return Infinity;
            
            const dx = obj2.x - obj1.x;
            const dy = obj2.y - obj1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        getAngle(obj1, obj2) {
            if (!obj1 || !obj2) return 0;
            
            return Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
        }

        getDirectionVector(from, to) {
            const angle = this.getAngle(from, to);
            return {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };
        }

        findNearest(source, targets) {
            if (!targets || targets.length === 0) return null;
            
            let nearest = null;
            let minDist = Infinity;
            
            for (const target of targets) {
                const dist = this.getDistance(source, target);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = target;
                }
            }
            
            return nearest;
        }

        findInRange(source, targets, range) {
            if (!targets) return [];
            
            const inRange = [];
            const rangeSq = range * range;
            
            for (const target of targets) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < rangeSq) {
                    inRange.push(target);
                }
            }
            
            return inRange;
        }

        checkPointInCircle(px, py, cx, cy, radius) {
            const dx = px - cx;
            const dy = py - cy;
            return dx * dx + dy * dy < radius * radius;
        }

        checkPointInRect(px, py, rx, ry, rw, rh) {
            return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
        }

        resolveCircleCollision(circle1, circle2, restitution = 0.5) {
            if (!this.checkCircleCollision(circle1, circle2)) return;
            
            const dx = circle2.x - circle1.x;
            const dy = circle2.y - circle1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = circle1.radius + circle2.radius;
            const overlap = minDist - distance;
            
            if (overlap <= 0) return;
            
            const nx = dx / distance;
            const ny = dy / distance;
            const separationX = nx * overlap * 0.5;
            const separationY = ny * overlap * 0.5;
            
            if (!circle1.static) {
                circle1.x -= separationX;
                circle1.y -= separationY;
            }
            if (!circle2.static) {
                circle2.x += separationX;
                circle2.y += separationY;
            }
            
            if (restitution > 0 && circle1.vx !== undefined && circle2.vx !== undefined) {
                const dvx = circle1.vx - circle2.vx;
                const dvy = circle1.vy - circle2.vy;
                const dvDotN = dvx * nx + dvy * ny;
                
                if (dvDotN > 0) {
                    const mass1 = circle1.mass || 1;
                    const mass2 = circle2.mass || 1;
                    const totalMass = mass1 + mass2;
                    const impulse = (2 * dvDotN * restitution) / totalMass;
                    
                    if (!circle1.static) {
                        circle1.vx -= impulse * mass2 * nx;
                        circle1.vy -= impulse * mass2 * ny;
                    }
                    if (!circle2.static) {
                        circle2.vx += impulse * mass1 * nx;
                        circle2.vy += impulse * mass1 * ny;
                    }
                }
            }
        }

        raycast(startX, startY, angle, maxDist, objects) {
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            
            let nearestHit = null;
            let nearestDist = maxDist;
            
            for (const obj of objects) {
                if (this.checkLineCircleCollision(
                    startX, startY,
                    startX + dx * maxDist, startY + dy * maxDist,
                    obj, obj.radius || 10
                )) {
                    const dist = this.getDistance({ x: startX, y: startY }, obj);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestHit = {
                            object: obj,
                            distance: dist,
                            point: {
                                x: startX + dx * dist,
                                y: startY + dy * dist
                            }
                        };
                    }
                }
            }
            
            return nearestHit;
        }
    }

    if (typeof window !== 'undefined') {
        window.CollisionSystem = CollisionSystem;
    }

})();
