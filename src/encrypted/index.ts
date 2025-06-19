import {hash, compare} from "bcrypt"

export async function createHash(password:string) {
    const passwordhash = await hash(password, 10)

    return passwordhash
}

export async function compareHash(password:string, hash:string) {
    const same = await compare(password, hash)

    return same
}