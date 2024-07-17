import { HydraHandler } from '../../types';
import { example } from './example';

const handlers: Record<string, HydraHandler<any> | undefined> = {
    'example': example
}

export default handlers;