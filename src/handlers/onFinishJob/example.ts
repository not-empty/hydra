import { PoolJob } from "../../types";

interface JobValue {
    name: string;
}

export async function example(job: PoolJob<JobValue>) {
    // do something
}