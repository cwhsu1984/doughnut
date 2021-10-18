class MindmapSector {
    readonly radius = 210

    parentX: number | null = null

    parentY: number | null = null

    nx: number

    ny: number

    startAngle: number

    angle: number

    constructor(x: number, y: number, startAngle: number, angle: number) {
        this.nx = x
        this.ny = y
        this.startAngle = startAngle
        this.angle = angle
    }

    get x(): number {
        return this.nx
    }

    get y(): number {
        return this.ny
    }

    get isHead(): boolean {
        return this.parentX === null
    }

    connection(boxWidth: number, boxHeight: number): any {
        return { x1: this.parentX, y1: this.parentY, x2: this.nx, y2: this.ny}
    }

    getChildSector(siblingCount: number, index: number): MindmapSector {
        const ang = this.startAngle + this.angle / siblingCount * index + this.angle / siblingCount / 2
        const x = this.nx + this.radius * Math.sin(ang)
        const y = this.ny + this.radius * Math.cos(ang)
        const start = this.startAngle + this.angle / siblingCount * index - Math.PI / 10
        const child = new MindmapSector(x, y, start, this.angle / siblingCount + Math.PI / 5)
        child.parentX = this.nx
        child.parentY = this.ny
        return child
    }

}

const x = 1

export default MindmapSector
