/**
 * Google OAuth Redirect 回调处理路由
 * 路径：/auth/google/callback
 * 
 * 工作流程：
 * 1. Google 认证完成后，带着 code 参数跳转到这里
 * 2. 用 code 换取 access_token
 * 3. 用 access_token 获取用户信息，完成登录
 * 4. 跳转回来源页面
 */

import type { Route } from "./+types/route";
import { redirect } from "react-router";
import { googleOAuthLogin } from "~/.server/services/auth";
import { getSessionHandler } from "~/.server/libs/session";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // 存储来源页面URL
    const error = url.searchParams.get("error");

    // Google 用户取消登录
    if (error || !code) {
        const returnTo = state ? decodeURIComponent(state) : "/";
        return redirect(returnTo);
    }

    try {
        const clientId = context.cloudflare.env.GOOGLE_CLIENT_ID;
        const clientSecret = context.cloudflare.env.GOOGLE_CLIENT_SECRET;
        const domain = context.cloudflare.env.DOMAIN;
        const redirectUri = `${domain}/auth/google/callback`;

        // 用 code 换取 access_token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            console.error("Token exchange failed:", await tokenRes.text());
            const returnTo = state ? decodeURIComponent(state) : "/";
            return redirect(returnTo + "?login_error=1");
        }

        const { access_token } = await tokenRes.json<{ access_token: string }>();

        // 用 access_token 获取用户信息
        const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!userRes.ok) {
            const returnTo = state ? decodeURIComponent(state) : "/";
            return redirect(returnTo + "?login_error=1");
        }

        const userInfo = await userRes.json<GoogleUserInfo>();

        // 完成登录，写入 session
        const [session, { commitSession }] = await getSessionHandler(request);
        const user = await googleOAuthLogin({
            profile: userInfo,
            request,
            session: session.id,
            hasUsedGuestCredit: false,
        });
        session.set("user", user);

        const returnTo = state ? decodeURIComponent(state) : "/";
        return redirect(returnTo, {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
    } catch (error) {
        console.error("Google OAuth callback error:", error);
        const returnTo = state ? decodeURIComponent(state) : "/";
        return redirect(returnTo + "?login_error=1");
    }
};
