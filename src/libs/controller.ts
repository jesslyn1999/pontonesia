import { Request, Response, NextFunction } from 'express'

interface IFacade {
    create(data: any): Promise<any>
    find(query: any): Promise<any[]>
    findOne(query: any): Promise<any>
    findById(id: string): Promise<any>
    update(query: any, data: any): Promise<{ n: number; nModified: number }>
    remove(query: any): Promise<any>
}

interface IController {
    create(req: Request, res: Response, next: NextFunction): void
    find(req: Request, res: Response, next: NextFunction): void
    findOne(req: Request, res: Response, next: NextFunction): void
    findById(req: Request, res: Response, next: NextFunction): void
    update(req: Request, res: Response, next: NextFunction): void
    remove(req: Request, res: Response, next: NextFunction): void
}

class Controller implements IController {
    private facade: IFacade

    constructor(facade: IFacade) {
        this.facade = facade
    }

    create(req: Request, res: Response, next: NextFunction): void {
        this.facade.create(req.body)
            .then(doc => res.status(201).json(doc))
            .catch(err => next(err))
    }

    find(req: Request, res: Response, next: NextFunction): void {
        this.facade.find(req.query)
            .then(collection => res.status(200).json(collection))
            .catch(err => next(err))
    }

    findOne(req: Request, res: Response, next: NextFunction): void {
        this.facade.findOne(req.query)
            .then(doc => res.status(200).json(doc))
            .catch(err => next(err))
    }

    findById(req: Request, res: Response, next: NextFunction): void {
        this.facade.findById(req.params.id)
            .then((doc) => {
                if (!doc) {
                    res.sendStatus(404)
                    return
                }
                res.status(200).json(doc)
            })
            .catch(err => next(err))
    }

    update(req: Request, res: Response, next: NextFunction): void {
        this.facade.update({ _id: req.params.id }, req.body)
            .then((results) => {
                if (results.n < 1) {
                    res.sendStatus(404)
                    return
                }
                if (results.nModified < 1) {
                    res.sendStatus(304)
                    return
                }
                res.sendStatus(204)
            })
            .catch(err => next(err))
    }

    remove(req: Request, res: Response, next: NextFunction): void {
        this.facade.remove({ _id: req.params.id })
            .then((doc) => {
                if (!doc) {
                    res.sendStatus(404)
                    return
                }
                res.sendStatus(204)
            })
            .catch(err => next(err))
    }
}

export default Controller;
