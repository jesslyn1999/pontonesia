import logger from 'src/libs/logger';

let id = 0;
interface Example {
    id: number;
    name: string;
}

const examples: Example[] = [
    { id: id++, name: 'example 0' },
    { id: id++, name: 'example 1' },
];

export class ExamplesService {
    all(): Promise<Example[]> {
        logger.info(examples, 'fetch all examples');
        return Promise.resolve(examples);
    }

    byId(id: number): Promise<Example> {
        logger.info(`fetch example with id ${id}`);
        return this.all().then((r) => r[id]);
    }

    create(name: string): Promise<Example> {
        logger.info(`create example with name ${name}`);
        const example: Example = {
            id: id++,
            name,
        };
        examples.push(example);
        return Promise.resolve(example);
    }
}

export default new ExamplesService();
