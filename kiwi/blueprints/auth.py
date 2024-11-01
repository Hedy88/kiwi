import base64
import secrets

import itsdangerous
import bcrypt
from quart import Blueprint, jsonify, request, current_app as app

from kiwi.auth import token_check
from kiwi.common.users import create_user
from kiwi.schemas import validate, REGISTER

bp = Blueprint("auth", __name__)

async def check_password(pwd_hash: str, given_password: str) -> bool:
    pwd_encoded = pwd_hash.encode()
    given_encoded = given_password.encode()

    return await app.loop.run_in_executor(
        None, bcrypt.checkpw, given_encoded, pwd_encoded
    )

def make_token(user_id, user_pwd_hash) -> str:
    signer = itsdangerous.TimestampSigner(user_pwd_hash)
    user_id = base64.b64encode(str(user_id).encode())

    return signer.sign(user_id).decode()

@bp.route("/signup", methods=["POST"])
async def signup():
    j = await request.get_json()
    j = validate(j, REGISTER)

    username, email, password = j["username"], j["email"], j["password"]

    await create_user(username, email, password)

    return jsonify({ "success": True })

@bp.route("/login", methods=["POST"])
async def login():
    j = await request.get_json()
    username, password = j["username"], j["password"]

    row = await app.db.fetchrow(
        """SELECT id, password_hash FROM users WHERE username = $1""",
        username
    )

    if not row:
        return jsonify({ "success": False, "message": "Invalid username or password" }), 401

    user_id, password_hash = row

    if not await check_password(password_hash, password):
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

    return jsonify({"token": make_token(user_id, password_hash)})

@bp.route("/logout", methods=["POST"])
async def logout():
    return "", 204

