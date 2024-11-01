import asyncio
import asyncpg
import config

from quart import Quart, jsonify, request
from winter import SnowflakeFactory

from kiwi.blueprints import (
    auth,
)

from kiwi.errors import BirdeyeError

def make_app():
    app = Quart(__name__)

    app.config.from_object(config.Config)
    return app

def set_blueprints(app_: Quart):
    bps = {
        auth: "/auth",
    }

    for bp, suffix in bps.items():
        app_.register_blueprint(
            bp.bp, url_prefix=f"/api/{suffix}"
        )

app = make_app()
set_blueprints(app)

async def init_app_db(app_: Quart):
    app_.db = await asyncpg.create_pool(**app.config["POSTGRES"])

def init_app_managers(app_: Quart):
    app_.loop = asyncio.get_event_loop()
    app_.winter_factory = SnowflakeFactory(epoch=1730486592)

@app.before_serving
async def app_before_serving():
    await init_app_db(app)

    init_app_managers(app)

@app.errorhandler(BirdeyeError)
async def handle_birdeye_err(err):
    return (
        jsonify(
            {"success": False, "message": err.message}
        ),
        err.status_code,
    )

@app.errorhandler(500)
async def handle_500(err):
    return (
        jsonify({"success": False, "message": repr(err), "internal_server_error": True}),
        500,
    )
