# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - paragraph [ref=e8]: Your Workplace Charging Concierge.
      - generic [ref=e9]:
        - generic [ref=e12]:
          - generic [ref=e15]:
            - heading "Login" [level=1] [ref=e16]
            - text: Welcome! Enter your credentials to continue.
          - generic [ref=e17]:
            - generic "Login" [ref=e18]:
              - generic [ref=e19]: Login
            - generic [ref=e21]:
              - textbox "Login" [ref=e22]
              - group
          - generic [ref=e23]:
            - generic [ref=e24]:
              - generic "Password" [ref=e25]:
                - generic [ref=e26]: Password
              - generic [ref=e28]:
                - textbox "Password" [ref=e29]
                - button "Hide password" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]
                - group
            - link "Forgot Password" [ref=e34] [cursor=pointer]:
              - /url: /auth/forgot-password
          - generic [ref=e35]:
            - link "Register" [ref=e36] [cursor=pointer]:
              - /url: /auth/register
            - button "Log In" [disabled]
        - img "CALSTART" [ref=e38]
    - link [ref=e39] [cursor=pointer]:
      - img
```