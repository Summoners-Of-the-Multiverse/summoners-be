const setDeep = (obj: any, path: any, value: any, setrecursively = false) => {
    path.reduce((a: any, b: any, level: any) => {
        if (setrecursively && typeof a[b] === "undefined" && level !== path.length-1){
            a[b] = {};
            return a[b];
        }

        if (level == path.length-1){
            a[b] = value;
            return value;
        }
        return a[b];
    }, obj);
}

export class PromisifyBatchRequest {
    batch: any;
    requests: any;

    constructor(web3: any) {
        this.batch = new web3.BatchRequest;
        this.requests = [];
    }

    add = (_request: any, path = ['default'], ...params: any[]) => {
        let that = this;
        let request = new Promise((resolve, reject) => {
            that.batch.add(_request.call(null, ...params, (err:any, data:any) => {
                if (err) return reject(err);

                let result = {};
                setDeep(result, path, data, true);

                resolve(result);
            }));
        });
        this.requests.push(request);
    }

    execute = async () => {
        this.batch.execute();
        return await Promise.all(this.requests);
    }
}

// https://github.com/ChainSafe/web3.js/issues/1446