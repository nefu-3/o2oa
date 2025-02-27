package com.x.query.assemble.surface.jaxrs.statement;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.bean.tuple.Pair;
import com.x.base.core.project.exception.ExceptionAccessDenied;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.query.assemble.surface.Business;
import com.x.query.assemble.surface.ThisApplication;
import com.x.query.core.entity.schema.Statement;
import com.x.query.core.express.statement.ExecuteTarget;
import com.x.query.core.express.statement.ExecuteTargetBuilder;
import com.x.query.core.express.statement.Executor;
import com.x.query.core.express.statement.Runtime;

import java.util.Optional;

class ActionExecute extends BaseAction {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActionExecute.class);

    ActionResult<Object> execute(EffectivePerson effectivePerson, String flag, String mode, Integer page, Integer size,
            JsonElement jsonElement) throws Exception {

        LOGGER.debug("execute:{}, flag:{}, mode:{}, page:{}, size:{}, jsonElement:{}.",
                effectivePerson::getDistinguishedName, () -> flag, () -> mode, () -> page, () -> size,
                () -> jsonElement);
        ClassLoader classLoader = Business.getDynamicEntityClassLoader();
        Thread.currentThread().setContextClassLoader(classLoader);
        ActionResult<Object> result = new ActionResult<>();
        Statement statement;
        Runtime runtime;
        Pair<ExecuteTarget, Optional<ExecuteTarget>> executeTargetPair;
        try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
            Business business = new Business(emc);
            statement = emc.flag(flag, Statement.class);
            if (null == statement) {
                throw new ExceptionEntityNotExist(flag, Statement.class);
            }
            if (!business.executable(effectivePerson, statement)) {
                throw new ExceptionAccessDenied(effectivePerson, statement);
            }
            //兼容旧版本jsonElement本身即为parameter参数内容
            JsonObject runTimeJson = jsonElement.getAsJsonObject();
            if (!runTimeJson.has(Runtime.parameter_FIELDNAME) && !runTimeJson.has(Runtime.parameter_FIELDNAME)){
                JsonObject rtJson = new JsonObject();
                rtJson.add(Runtime.parameter_FIELDNAME, jsonElement);
                runTimeJson = rtJson;
            }
            runtime = Runtime.concrete(effectivePerson, runTimeJson, business.organization(), page, size);
            ExecuteTargetBuilder builder = new ExecuteTargetBuilder(ThisApplication.context(), effectivePerson,
                    business.organization(), statement, runtime);
            executeTargetPair = builder.build();
        }
        ExecuteTarget dataExecuteTarget = executeTargetPair.first();
        Optional<ExecuteTarget> optionalCountExecuteTarget = executeTargetPair.second();
        if(!Statement.MODE_COUNT.equals(mode)) {
            result.setData(Executor.executeData(statement, runtime, dataExecuteTarget));
        }
        if (optionalCountExecuteTarget.isPresent()) {
            result.setCount(Executor.executeCount(statement, optionalCountExecuteTarget.get()));
            if(Statement.MODE_COUNT.equals(mode)){
                result.setData(result.getCount());
            }
        }
        return result;
    }

}
