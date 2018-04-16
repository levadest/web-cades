/**
 * Created by root on 05.12.17.
 */

function * httpGet(url){
    const caller = yield;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (this.status === 200) {
            caller.success(this.response);
        }else{
            caller.failure(new Error(this.statusText))
        }
    };
    request.onerror = function(){
        caller.failure(new Error(
            'XMLHttpRequest Error: '+this.statusText
        ));
    };
    request.open('GET', url);
    request.send();
}

// run(function * downloads(){
//     let text1 = yield httpGet('http://localhost:8000/file1.html');
//     let text2 = yield httpGet('http://localhost:80000/file2.html');
//     console.log(text1, text2);
// });
//
// run(function * parallelDownloads(){
//     let [text1, text2] = yield [
//         httpGet('http://localhost:80000/file1.html'),
//         httpGet('http://localhost:80000/file2.html')
//     ];
//     console.log(text1, text2);
//
// });

function * echo(text, delay = 0){
    const caller = yield;
    setTimeout(()=>caller.success(text),delay)
}

run(function * echoes(){
    console.log(yield echo('this'));
    console.log(yield echo('is'));
    console.log(yield echo('a test'))
});

run(function * parallelEchoes(){
    let startTime = Date.now();
    let texts = yield [
        echo('this', 1000),
        echo('is', 900),
        echo('a test', 800)
    ];
    console.log(texts);
    console.log('Time: '+(Date.now() - startTime));
});

function runGenObj(genObj, callbacks = undefined){
    handleOneNext();
    /**
     * Handle one invocation of `next()`:
     * If there was a `prevResult`, it becomes the parameter.
     * What `next()` returns is what we have to run next.
     * The `success` callback triggers another round,
     * with the result assigned to `prevResult`.
     */
    function handleOneNext(prevResult = null){
        try{
            let yielded = genObj.next(prevResult);
            if (yielded.done){
                if (yielded.value !== undefined){
                    callbacks.success(yielded.value);
                }
            }else{
                setTimeout(runYieldedValue, 0, yielded.value)
            }
        }
        catch(error){
            if(callbacks){
                callbacks.failure(error)
            }else{
                throw error;
            }
        }
    }
    function runYieldedValue(yieldedValue){
        if (yieldedValue === undefined){
            handleOneNext(callbacks);
        }else if(Array.isArray(yieldedValue)){
            runInParallel(yieldedValue)
        }else{
            runGenObj(yieldedValue, {
                success(result){
                    handleOneNext(result);
                },
                failure(err){
                    genObj.throw(err);
                },
            });
        }
    }

    function runInParallel(genObjs){
        let resultArray = new Array(genObjs.length);
        let resultCountdown = genObjs.length;
        for (let [i,genObj] of genObjs.entries()){
            runGenObj(genObj, {
                success(result){
                    resultArray[i] = result
                    resultCountdown--;
                    if(resultCountdown <= 0){
                        handleOneNext(resultArray);
                    }
                },
                failure(err){
                    genObj.throw(err)
                }
            })
        }
    }
}
function run(genFunc){
    runGenObj(genFunc());
}

